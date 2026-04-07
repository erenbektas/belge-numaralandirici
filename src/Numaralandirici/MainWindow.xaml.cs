using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using Numaralandirici.ViewModels;

namespace Numaralandirici;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    [DllImport("dwmapi.dll", PreserveSig = true)]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

    public MainWindow()
    {
        InitializeComponent();
        _viewModel = new MainViewModel();
        DataContext = _viewModel;
        _viewModel.PropertyChanged += ViewModel_PropertyChanged;

        SourceInitialized += (_, _) =>
        {
            var hwnd = new WindowInteropHelper(this).Handle;
            int darkMode = 1;
            // Attribute 20: DWMWA_USE_IMMERSIVE_DARK_MODE (Windows 10 20H1+, Windows 11)
            DwmSetWindowAttribute(hwnd, 20, ref darkMode, sizeof(int));
            // Attribute 19: undocumented predecessor (older Windows 10 builds)
            DwmSetWindowAttribute(hwnd, 19, ref darkMode, sizeof(int));
        };
    }

    protected override void OnClosed(EventArgs e)
    {
        _viewModel.PropertyChanged -= ViewModel_PropertyChanged;
        base.OnClosed(e);
    }

    private void ViewModel_PropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(MainViewModel.CurrentPage))
        {
            var page = _viewModel.CurrentPage;

            // Pages
            FileListPage.Visibility = page == AppPage.FileList ? Visibility.Visible : Visibility.Collapsed;
            PreviewPage.Visibility = page == AppPage.Preview ? Visibility.Visible : Visibility.Collapsed;
            SummaryPage.Visibility = page == AppPage.Summary ? Visibility.Visible : Visibility.Collapsed;

            // File list buttons
            BtnAddFiles.Visibility = page == AppPage.FileList ? Visibility.Visible : Visibility.Collapsed;
            BtnClear.Visibility = page == AppPage.FileList ? Visibility.Visible : Visibility.Collapsed;
            BtnContinue.Visibility = page == AppPage.FileList ? Visibility.Visible : Visibility.Collapsed;

            // Preview buttons
            BtnBackPreview.Visibility = page == AppPage.Preview ? Visibility.Visible : Visibility.Collapsed;
            BtnNumarandir.Visibility = page == AppPage.Preview ? Visibility.Visible : Visibility.Collapsed;

            // Summary page has no bottom buttons

            // Drag-drop only on file list page
            AllowDrop = page == AppPage.FileList;
        }
        else if (e.PropertyName == nameof(MainViewModel.IsFileSizeLarge))
        {
            bool large = _viewModel.IsFileSizeLarge;
            TxtFileSize.Foreground = large
                ? (System.Windows.Media.Brush)FindResource("WarningText")
                : (System.Windows.Media.Brush)FindResource("TextPrimary");
            TxtFileSizeWarning.Visibility = large ? Visibility.Visible : Visibility.Collapsed;
        }
        else if (e.PropertyName == nameof(MainViewModel.SelectedPreset))
        {
            var preset = _viewModel.SelectedPreset;
            CustomCompressionPanel.Visibility = preset == CompressionPreset.Custom
                ? Visibility.Visible : Visibility.Collapsed;

            // Highlight selected preset button
            var accentBrush = (System.Windows.Media.Brush)FindResource("AccentColor");
            var defaultBrush = (System.Windows.Media.Brush)FindResource("ButtonBg");
            BtnPresetLow.Background = preset == CompressionPreset.Low ? accentBrush : defaultBrush;
            BtnPresetHigh.Background = preset == CompressionPreset.High ? accentBrush : defaultBrush;
            BtnPresetCustom.Background = preset == CompressionPreset.Custom ? accentBrush : defaultBrush;

            var whiteBrush = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Colors.White);
            var textBrush = (System.Windows.Media.Brush)FindResource("TextPrimary");
            BtnPresetLow.Foreground = preset == CompressionPreset.Low ? whiteBrush : textBrush;
            BtnPresetHigh.Foreground = preset == CompressionPreset.High ? whiteBrush : textBrush;
            BtnPresetCustom.Foreground = preset == CompressionPreset.Custom ? whiteBrush : textBrush;
        }
    }

    private void BtnInfo_Click(object sender, RoutedEventArgs e)
    {
        new InfoWindow { Owner = this }.ShowDialog();
    }

    private void FileList_SizeChanged(object sender, SizeChangedEventArgs e)
    {
        if (FileList.View is System.Windows.Controls.GridView gridView && gridView.Columns.Count >= 5)
        {
            double otherColumnsWidth = 0;
            for (int i = 0; i < gridView.Columns.Count; i++)
            {
                if (i != 2) // Skip "Dosya Adı" column (index 2: remove, sıra, dosya adı, tür, durum)
                    otherColumnsWidth += gridView.Columns[i].ActualWidth;
            }

            double available = FileList.ActualWidth - otherColumnsWidth - 30; // 30 for scrollbar + padding
            if (available > 100)
                gridView.Columns[2].Width = available;
        }
    }

    private void Window_DragOver(object sender, DragEventArgs e)
    {
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
            e.Effects = DragDropEffects.Copy;
        else
            e.Effects = DragDropEffects.None;
        e.Handled = true;
    }

    private void Window_Drop(object sender, DragEventArgs e)
    {
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            var files = (string[])e.Data.GetData(DataFormats.FileDrop)!;
            _viewModel.AddDroppedFiles(files);
            CommandManager.InvalidateRequerySuggested();
        }
    }
}
