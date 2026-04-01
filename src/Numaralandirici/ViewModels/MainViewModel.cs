using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using Numaralandirici.Models;
using Numaralandirici.Services;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace Numaralandirici.ViewModels;

public enum AppPage { FileList, Preview, Summary }

public class MainViewModel : INotifyPropertyChanged
{
    private string _statusText = "Dosyaları sürükleyip bırakın veya ekleyin.";
    private double _progress;
    private bool _isProcessing;
    private AppPage _currentPage = AppPage.FileList;
    private List<string> _tempPdfFiles = new();
    private string _mergedTempPath = "";
    private string _summaryFileSize = "";
    private bool _isFileSizeLarge;
    private int _summaryPageCount;

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

    public ICommand AddFilesCommand { get; }
    public ICommand ContinueCommand { get; }
    public ICommand NumaralandirCommand { get; }
    public ICommand SaveCommand { get; }
    public ICommand PreviewMergedCommand { get; }
    public ICommand BackCommand { get; }
    public ICommand ClearCommand { get; }
    public ICommand RemoveFileCommand { get; }

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
            Filter = "Desteklenen Dosyalar|*.pdf;*.jpg;*.jpeg;*.png;*.bmp;*.gif;*.tiff;*.tif;*.doc;*.docx;*.xls;*.xlsx;*.msg|Tüm Dosyalar|*.*",
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
            try { if (File.Exists(_mergedTempPath)) File.Delete(_mergedTempPath); } catch { }
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

    private async void MagnifyPage(object? param)
    {
        if (param is not PagePreview preview)
            return;

        try
        {
            var fullImage = await PdfThumbnailGenerator.GenerateSingleAsync(
                preview.TempPdfPath, preview.PageIndex, width: 800);

            var image = new Image
            {
                Source = fullImage,
                MaxHeight = 800,
                Stretch = Stretch.Uniform
            };

            if (preview.Rotation != 0)
            {
                image.LayoutTransform = new RotateTransform(preview.Rotation);
            }

            var window = new Window
            {
                WindowStyle = WindowStyle.None,
                ResizeMode = ResizeMode.NoResize,
                Background = new SolidColorBrush(Color.FromArgb(240, 0, 0, 0)),
                SizeToContent = SizeToContent.WidthAndHeight,
                WindowStartupLocation = WindowStartupLocation.CenterScreen,
                Topmost = true,
                Content = new Border
                {
                    Padding = new Thickness(20),
                    Child = image
                }
            };

            window.MouseDown += (s, e) => window.Close();
            window.KeyDown += (s, e) => { if (e.Key == Key.Escape) window.Close(); };
            window.ShowDialog();
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
                string fileLabel = filesList[i].Order.DisplayText;

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
                            MagnifyCommand = new RelayCommand(MagnifyPage)
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

            // Apply rotations and stamps
            await Task.Run(() =>
            {
                var previewsByFile = Previews.GroupBy(p => p.FileIndex).OrderBy(g => g.Key);
                var filesList = Files.ToList();
                var stampedOrders = new HashSet<string>();

                foreach (var group in previewsByFile)
                {
                    int fileIndex = group.Key;
                    string tempPath = _tempPdfFiles[fileIndex];
                    var pages = group.OrderBy(p => p.PageIndex).ToList();
                    string orderText = filesList[fileIndex].Order.DisplayText;
                    bool shouldStamp = stampedOrders.Add(orderText);

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
            _mergedTempPath = Path.Combine(Path.GetTempPath(), $"numaralandirici_merged_{Guid.NewGuid()}.pdf");
            await Task.Run(() => PdfMerger.Merge(_tempPdfFiles, _mergedTempPath));

            // Calculate summary info
            var fileInfo = new FileInfo(_mergedTempPath);
            long fileSizeBytes = fileInfo.Length;
            double fileSizeMB = fileSizeBytes / (1024.0 * 1024.0);

            int pageCount = 0;
            await Task.Run(() =>
            {
                using var doc = PdfReader.Open(_mergedTempPath, PdfDocumentOpenMode.Import);
                pageCount = doc.PageCount;
            });

            await Application.Current.Dispatcher.InvokeAsync(() =>
            {
                SummaryPageCount = pageCount;
                IsFileSizeLarge = fileSizeMB > 11;

                if (fileSizeMB >= 1)
                    SummaryFileSize = $"{fileSizeMB:F1} MB";
                else
                    SummaryFileSize = $"{fileSizeBytes / 1024.0:F0} KB";

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

    private void CleanupAll()
    {
        CleanupTempFiles();
        try { if (File.Exists(_mergedTempPath)) File.Delete(_mergedTempPath); } catch { }
        _mergedTempPath = "";
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
            try { if (File.Exists(temp)) File.Delete(temp); } catch { }
        }
        _tempPdfFiles.Clear();
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
