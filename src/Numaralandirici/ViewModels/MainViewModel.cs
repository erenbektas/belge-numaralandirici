using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using Microsoft.Win32;
using Numaralandirici.Helpers;
using Numaralandirici.Models;
using Numaralandirici.Services;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace Numaralandirici.ViewModels;

public enum AppPage { FileList, Preview, Summary }
public enum CompressionPreset { None, Low, High, Custom }

public class MainViewModel : INotifyPropertyChanged
{
    // E-posta ek sınırı (birçok kurum 10-15 MB arası sınır uygular)
    private const double FileSizeWarningThresholdMB = 11;

    private string _statusText = "Dosyaları sürükleyip bırakın veya ekleyin.";
    private double _progress;
    private bool _isProcessing;
    private AppPage _currentPage = AppPage.FileList;
    private List<string> _tempPdfFiles = new();
    private string _mergedTempPath = "";
    private string _uncompressedTempPath = "";
    private string _summaryFileSize = "";
    private bool _isFileSizeLarge;
    private int _summaryPageCount;
    private CompressionPreset _selectedPreset = CompressionPreset.None;
    private int _customDpi = 144;
    private int _customQuality = 75;
    private bool _isCompressed;

    public ObservableCollection<FileEntry> Files { get; } = new();
    public ObservableCollection<PagePreview> Previews { get; } = new();

    public string StatusText
    {
        get => _statusText;
        set { _statusText = value; OnPropertyChanged(); }
    }

    public double Progress
    {
        get => _progress;
        set { _progress = value; OnPropertyChanged(); }
    }

    public bool IsProcessing
    {
        get => _isProcessing;
        set { _isProcessing = value; OnPropertyChanged(); CommandManager.InvalidateRequerySuggested(); }
    }

    public AppPage CurrentPage
    {
        get => _currentPage;
        set { _currentPage = value; OnPropertyChanged(); CommandManager.InvalidateRequerySuggested(); }
    }

    public string SummaryFileSize
    {
        get => _summaryFileSize;
        set { _summaryFileSize = value; OnPropertyChanged(); }
    }

    public bool IsFileSizeLarge
    {
        get => _isFileSizeLarge;
        set { _isFileSizeLarge = value; OnPropertyChanged(); }
    }

    public int SummaryPageCount
    {
        get => _summaryPageCount;
        set { _summaryPageCount = value; OnPropertyChanged(); }
    }

    public CompressionPreset SelectedPreset
    {
        get => _selectedPreset;
        set { _selectedPreset = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsCustomPreset)); }
    }

    public bool IsCustomPreset => SelectedPreset == CompressionPreset.Custom;

    public int CustomDpi
    {
        get => _customDpi;
        set { _customDpi = value; OnPropertyChanged(); }
    }

    public int CustomQuality
    {
        get => _customQuality;
        set { _customQuality = value; OnPropertyChanged(); }
    }

    public bool IsCompressed
    {
        get => _isCompressed;
        set { _isCompressed = value; OnPropertyChanged(); }
    }

    public ICommand AddFilesCommand { get; }
    public ICommand ContinueCommand { get; }
    public ICommand NumaralandirCommand { get; }
    public ICommand SaveCommand { get; }
    public ICommand PreviewMergedCommand { get; }
    public ICommand BackCommand { get; }
    public ICommand ClearCommand { get; }
    public ICommand RemoveFileCommand { get; }
    public ICommand SelectPresetCommand { get; }
    public ICommand CompressCommand { get; }

    public MainViewModel()
    {
        AddFilesCommand = new RelayCommand(_ => AddFiles(), _ => !IsProcessing);
        ContinueCommand = new RelayCommand(async _ => await ContinueToPreviewAsync(), _ => !IsProcessing && Files.Count > 0);
        NumaralandirCommand = new RelayCommand(async _ => await NumaralandirAsync(), _ => !IsProcessing);
        SaveCommand = new RelayCommand(_ => SaveMerged(), _ => !IsProcessing);
        PreviewMergedCommand = new RelayCommand(_ => PreviewMerged(), _ => !IsProcessing);
        BackCommand = new RelayCommand(_ => GoBack(), _ => !IsProcessing);
        ClearCommand = new RelayCommand(_ => Clear(), _ => !IsProcessing && Files.Count > 0);
        RemoveFileCommand = new RelayCommand(param => RemoveFile(param), _ => !IsProcessing);
        SelectPresetCommand = new RelayCommand(param => SelectPreset(param), _ => !IsProcessing);
        CompressCommand = new RelayCommand(async _ => await CompressAsync(), _ => !IsProcessing && SelectedPreset != CompressionPreset.None);

        Files.CollectionChanged += (_, _) => CommandManager.InvalidateRequerySuggested();
    }

    private void SelectPreset(object? param)
    {
        if (param is string preset)
        {
            SelectedPreset = preset switch
            {
                "Low" => CompressionPreset.Low,
                "High" => CompressionPreset.High,
                "Custom" => CompressionPreset.Custom,
                _ => CompressionPreset.None
            };
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private async Task CompressAsync()
    {
        int dpi, quality;
        switch (SelectedPreset)
        {
            case CompressionPreset.Low:
                dpi = 144; quality = 75; break;
            case CompressionPreset.High:
                dpi = 90; quality = 55; break;
            case CompressionPreset.Custom:
                dpi = CustomDpi; quality = CustomQuality; break;
            default: return;
        }

        IsProcessing = true;
        try
        {
            var progress = new Progress<string>(msg =>
                Application.Current.Dispatcher.Invoke(() => StatusText = msg));

            // Keep the uncompressed version for potential re-compression
            if (string.IsNullOrEmpty(_uncompressedTempPath))
            {
                _uncompressedTempPath = _mergedTempPath;
            }
            else
            {
                // Delete previous compressed version, recompress from original
                if (_mergedTempPath != _uncompressedTempPath)
                {
                    try { File.Delete(_mergedTempPath); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {_mergedTempPath} - {ex.Message}"); }
                }
                _mergedTempPath = _uncompressedTempPath;
            }

            string compressedPath = await PdfCompressor.CompressAsync(_mergedTempPath, dpi, quality, progress);
            _mergedTempPath = compressedPath;

            UpdateFileSizeInfo();
            IsCompressed = true;

            await Application.Current.Dispatcher.InvokeAsync(() =>
                StatusText = "Sıkıştırma tamamlandı.");
        }
        catch (Exception ex)
        {
            await Application.Current.Dispatcher.InvokeAsync(() =>
                StatusText = $"Sıkıştırma hatası: {ex.Message}");

            MessageBox.Show(
                $"Sıkıştırma sırasında hata oluştu:\n{ex.Message}",
                "Hata",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
        finally
        {
            IsProcessing = false;
        }
    }

    public void AddDroppedFiles(string[] paths)
    {
        foreach (var path in paths)
        {
            if (Directory.Exists(path))
            {
                var dirFiles = Directory.GetFiles(path)
                    .Where(FileConverter.IsSupported)
                    .ToArray();
                AddDroppedFiles(dirFiles);
                continue;
            }

            if (!File.Exists(path) || !FileConverter.IsSupported(path))
                continue;

            if (Files.Any(f => f.FilePath.Equals(path, StringComparison.OrdinalIgnoreCase)))
                continue;

            var order = FileNameParser.Parse(path);
            Files.Add(new FileEntry(path, order));
        }

        SortFiles();
    }

    private void AddFiles()
    {
        var dialog = new OpenFileDialog
        {
            Multiselect = true,
            Filter = "Desteklenen Dosyalar|*.pdf;*.jpg;*.jpeg;*.jfif;*.png;*.bmp;*.gif;*.tiff;*.tif;*.doc;*.docx;*.xls;*.xlsx;*.msg|Tüm Dosyalar|*.*",
            Title = "Dosya Seçin"
        };

        if (dialog.ShowDialog() == true)
            AddDroppedFiles(dialog.FileNames);
    }

    private void SortFiles()
    {
        var sorted = Files.OrderBy(f => f.Order).ToList();
        Files.Clear();
        foreach (var f in sorted)
            Files.Add(f);
    }

    private void Clear()
    {
        Files.Clear();
        Progress = 0;
        StatusText = "Dosyaları sürükleyip bırakın veya ekleyin.";
    }

    private void RemoveFile(object? param)
    {
        if (param is FileEntry entry)
            Files.Remove(entry);
    }

    private void GoBack()
    {
        if (CurrentPage == AppPage.Summary)
        {
            // Go back to preview, keep temp files
            try { File.Delete(_mergedTempPath); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {_mergedTempPath} - {ex.Message}"); }
            _mergedTempPath = "";
            CurrentPage = AppPage.Preview;
            Progress = 0;
            StatusText = $"Önizleme hazır - {Previews.Count} sayfa";
            return;
        }

        // Go back to file list
        CleanupTempFiles();
        Previews.Clear();
        CurrentPage = AppPage.FileList;
        Progress = 0;
        StatusText = "Dosyaları sürükleyip bırakın veya ekleyin.";

        foreach (var file in Files)
            file.Status = "Bekliyor";
    }

    private void RotatePage(object? param)
    {
        if (param is PagePreview preview)
            preview.Rotation += 90;
    }

    private async Task MagnifyPageAsync(object? param)
    {
        if (param is not PagePreview preview)
            return;

        try
        {
            var fullImage = await PdfThumbnailGenerator.GenerateSingleAsync(
                preview.TempPdfPath, preview.PageIndex, width: 800);

            new MagnifyWindow(fullImage, preview.Rotation).ShowDialog();
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Önizleme açılamadı: {ex.Message}", "Hata",
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private async Task ContinueToPreviewAsync()
    {
        IsProcessing = true;
        Progress = 0;
        _tempPdfFiles.Clear();
        Previews.Clear();

        try
        {
            int total = Files.Count;
            var filesList = Files.ToList();

            for (int i = 0; i < filesList.Count; i++)
            {
                var entry = filesList[i];
                int index = i;

                await Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    entry.Status = "Dönüştürülüyor...";
                    StatusText = $"Dönüştürülüyor: {entry.FileName} ({index + 1}/{total})";
                });

                string tempPdf = await Task.Run(() =>
                {
                    try
                    {
                        return FileConverter.ConvertToPdf(entry.FilePath);
                    }
                    catch (Exception ex)
                    {
                        throw new Exception($"{entry.FileName} dönüştürülemedi: {ex.Message}", ex);
                    }
                });

                _tempPdfFiles.Add(tempPdf);

                await Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    entry.Status = "Hazır";
                    Progress = (double)(index + 1) / total * 80;
                });
            }

            await Application.Current.Dispatcher.InvokeAsync(() =>
                StatusText = "Önizleme hazırlanıyor...");

            int pageNum = 1;
            for (int i = 0; i < _tempPdfFiles.Count; i++)
            {
                var thumbnails = await PdfThumbnailGenerator.GenerateThumbnailsAsync(_tempPdfFiles[i]);
                string fileLabel = filesList[i].FileName;

                for (int j = 0; j < thumbnails.Count; j++)
                {
                    int pn = pageNum;
                    int fi = i;
                    int pi = j;
                    var thumb = thumbnails[j];
                    string path = _tempPdfFiles[i];

                    await Application.Current.Dispatcher.InvokeAsync(() =>
                    {
                        var preview = new PagePreview(thumb, fileLabel, pn, fi, pi, path)
                        {
                            RotateCommand = new RelayCommand(RotatePage),
                            MagnifyCommand = new RelayCommand(param => _ = MagnifyPageAsync(param))
                        };
                        Previews.Add(preview);
                    });
                    pageNum++;
                }

                await Application.Current.Dispatcher.InvokeAsync(() =>
                    Progress = 80 + (double)(i + 1) / _tempPdfFiles.Count * 20);
            }

            await Application.Current.Dispatcher.InvokeAsync(() =>
            {
                StatusText = $"Önizleme hazır - {Previews.Count} sayfa";
                Progress = 100;
                CurrentPage = AppPage.Preview;
            });
        }
        catch (Exception ex)
        {
            await Application.Current.Dispatcher.InvokeAsync(() =>
                StatusText = $"Hata: {ex.Message}");

            MessageBox.Show(
                $"İşlem sırasında hata oluştu:\n{ex.Message}",
                "Hata",
                MessageBoxButton.OK,
                MessageBoxImage.Error);

            CleanupTempFiles();
        }
        finally
        {
            IsProcessing = false;
        }
    }

    private async Task NumaralandirAsync()
    {
        IsProcessing = true;

        try
        {
            await Application.Current.Dispatcher.InvokeAsync(() =>
                StatusText = "Döndürmeler ve damgalar uygulanıyor...");

            // Snapshot collections on UI thread before background work
            var previewsSnapshot = Previews.ToList();
            var filesSnapshot = Files.ToList();
            var tempPdfFilesSnapshot = _tempPdfFiles.ToList();

            // Apply rotations and stamps
            await Task.Run(() =>
            {
                var previewsByFile = previewsSnapshot.GroupBy(p => p.FileIndex).OrderBy(g => g.Key);
                var stampedOrders = new HashSet<string>();

                foreach (var group in previewsByFile)
                {
                    int fileIndex = group.Key;
                    string tempPath = tempPdfFilesSnapshot[fileIndex];
                    var pages = group.OrderBy(p => p.PageIndex).ToList();
                    var order = filesSnapshot[fileIndex].Order;
                    string orderText = order.IsEmpty ? "" : order.DisplayText;
                    bool shouldStamp = !string.IsNullOrEmpty(orderText) && stampedOrders.Add(orderText);

                    bool anyRotated = pages.Any(p => p.Rotation != 0);
                    if (!anyRotated)
                    {
                        if (shouldStamp)
                        {
                            using var doc = PdfReader.Open(tempPath, PdfDocumentOpenMode.Modify);
                            PdfStamper.StampFirstPage(doc, orderText);
                            doc.Save(tempPath);
                        }
                        continue;
                    }

                    var newTempPath = tempPath + ".rotated.pdf";
                    using (var form = PdfSharp.Drawing.XPdfForm.FromFile(tempPath))
                    using (var newDoc = new PdfDocument())
                    {
                        foreach (var preview in pages)
                        {
                            if (preview.Rotation != 0)
                            {
                                PdfPageRotator.RotatePage(newDoc, form, preview.PageIndex, preview.Rotation);
                            }
                            else
                            {
                                using var srcDoc = PdfReader.Open(tempPath, PdfDocumentOpenMode.Import);
                                newDoc.AddPage(srcDoc.Pages[preview.PageIndex]);
                            }
                        }

                        if (shouldStamp)
                            PdfStamper.StampFirstPage(newDoc, orderText);

                        newDoc.Save(newTempPath);
                    }

                    File.Delete(tempPath);
                    File.Move(newTempPath, tempPath);
                }
            });

            await Application.Current.Dispatcher.InvokeAsync(() =>
                StatusText = "Birleştiriliyor...");

            // Merge to temp file
            _mergedTempPath = TempFile.NewPdf("merged");
            await Task.Run(() => PdfMerger.Merge(tempPdfFilesSnapshot, _mergedTempPath));

            // Calculate summary info
            int pageCount = 0;
            await Task.Run(() =>
            {
                using var doc = PdfReader.Open(_mergedTempPath, PdfDocumentOpenMode.Import);
                pageCount = doc.PageCount;
            });

            await Application.Current.Dispatcher.InvokeAsync(() =>
            {
                SummaryPageCount = pageCount;
                UpdateFileSizeInfo();
                SelectedPreset = CompressionPreset.None;
                IsCompressed = false;
                StatusText = "Numaralandırma tamamlandı.";
                Progress = 100;
                CurrentPage = AppPage.Summary;
            });
        }
        catch (Exception ex)
        {
            await Application.Current.Dispatcher.InvokeAsync(() =>
                StatusText = $"Hata: {ex.Message}");

            MessageBox.Show(
                $"İşlem sırasında hata oluştu:\n{ex.Message}",
                "Hata",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
        finally
        {
            IsProcessing = false;
        }
    }

    private void PreviewMerged()
    {
        if (string.IsNullOrEmpty(_mergedTempPath) || !File.Exists(_mergedTempPath))
            return;

        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = _mergedTempPath,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Dosya açılamadı: {ex.Message}", "Hata",
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void SaveMerged()
    {
        if (string.IsNullOrEmpty(_mergedTempPath) || !File.Exists(_mergedTempPath))
            return;

        var saveDialog = new SaveFileDialog
        {
            Filter = "PDF Dosyası|*.pdf",
            Title = "Çıktı PDF'i Kaydet",
            FileName = "birleştirilmiş.pdf"
        };

        if (saveDialog.ShowDialog() != true)
            return;

        try
        {
            File.Copy(_mergedTempPath, saveDialog.FileName, true);
            StatusText = $"Kaydedildi: {saveDialog.FileName}";

            MessageBox.Show(
                $"PDF başarıyla kaydedildi:\n{saveDialog.FileName}",
                "Başarılı",
                MessageBoxButton.OK,
                MessageBoxImage.Information);

            // Cleanup and reset
            CleanupAll();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Kaydetme sırasında hata oluştu:\n{ex.Message}",
                "Hata",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
    }

    private void UpdateFileSizeInfo()
    {
        if (string.IsNullOrEmpty(_mergedTempPath) || !File.Exists(_mergedTempPath))
            return;

        var fileInfo = new FileInfo(_mergedTempPath);
        long fileSizeBytes = fileInfo.Length;
        double fileSizeMB = fileSizeBytes / (1024.0 * 1024.0);

        IsFileSizeLarge = fileSizeMB > FileSizeWarningThresholdMB;
        SummaryFileSize = fileSizeMB >= 1
            ? $"{fileSizeMB:F1} MB"
            : $"{fileSizeBytes / 1024.0:F0} KB";
    }

    private void CleanupAll()
    {
        CleanupTempFiles();
        try { File.Delete(_mergedTempPath); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {_mergedTempPath} - {ex.Message}"); }
        if (!string.IsNullOrEmpty(_uncompressedTempPath) && _uncompressedTempPath != _mergedTempPath)
        {
            try { File.Delete(_uncompressedTempPath); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {_uncompressedTempPath} - {ex.Message}"); }
        }
        _mergedTempPath = "";
        _uncompressedTempPath = "";
        IsCompressed = false;
        SelectedPreset = CompressionPreset.None;
        Previews.Clear();
        CurrentPage = AppPage.FileList;
        Progress = 0;
        StatusText = "Dosyaları sürükleyip bırakın veya ekleyin.";

        foreach (var file in Files)
            file.Status = "Bekliyor";
    }

    private void CleanupTempFiles()
    {
        foreach (var temp in _tempPdfFiles)
        {
            try { File.Delete(temp); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {temp} - {ex.Message}"); }
        }
        _tempPdfFiles.Clear();
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
