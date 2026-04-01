using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using System.Windows.Media.Imaging;

namespace Numaralandirici.Models;

public class PagePreview : INotifyPropertyChanged
{
    private BitmapImage _thumbnail;
    private int _rotation;

    public BitmapImage Thumbnail
    {
        get => _thumbnail;
        set { _thumbnail = value; OnPropertyChanged(); }
    }

    public int Rotation
    {
        get => _rotation;
        set { _rotation = value % 360; OnPropertyChanged(); }
    }

    public string Label { get; }
    public int PageNumber { get; }
    public int FileIndex { get; }
    public int PageIndex { get; }
    public string TempPdfPath { get; }

    public ICommand? RotateCommand { get; set; }
    public ICommand? MagnifyCommand { get; set; }

    public PagePreview(BitmapImage thumbnail, string label, int pageNumber, int fileIndex, int pageIndex, string tempPdfPath)
    {
        _thumbnail = thumbnail;
        Label = label;
        PageNumber = pageNumber;
        FileIndex = fileIndex;
        PageIndex = pageIndex;
        TempPdfPath = tempPdfPath;
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
