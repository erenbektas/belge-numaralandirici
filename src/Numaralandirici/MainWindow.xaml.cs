using System.ComponentModel;
using System.Windows;
using System.Windows.Input;
using Numaralandirici.ViewModels;

namespace Numaralandirici;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    public MainWindow()
    {
        InitializeComponent();
        _viewModel = new MainViewModel();
        DataContext = _viewModel;
        _viewModel.PropertyChanged += ViewModel_PropertyChanged;
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
                ? new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0xCC, 0, 0))
                : (System.Windows.Media.Brush)FindResource("TextPrimary");
            TxtFileSizeWarning.Visibility = large ? Visibility.Visible : Visibility.Collapsed;
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
