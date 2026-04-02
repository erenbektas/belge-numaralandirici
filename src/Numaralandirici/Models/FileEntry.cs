using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;

namespace Numaralandirici.Models;

public class FileEntry : INotifyPropertyChanged, IComparable<FileEntry>
{
    private string _status = "Bekliyor";

    public string FilePath { get; }
    public string FileName => Path.GetFileName(FilePath);
    public string FileExtension => Path.GetExtension(FilePath).ToLowerInvariant();
    public OrderPrefix Order { get; }

    public string Status
    {
        get => _status;
        set { _status = value; OnPropertyChanged(); }
    }

    public string FileType => FileExtension switch
    {
        ".pdf" => "PDF",
        ".doc" or ".docx" => "Word",
        ".xls" or ".xlsx" => "Excel",
        ".msg" => "Outlook",
        ".jpg" or ".jpeg" or ".jfif" or ".png" or ".bmp" or ".gif" or ".tiff" or ".tif" => "Resim",
        _ => "Bilinmeyen"
    };

    public FileEntry(string filePath, OrderPrefix order)
    {
        FilePath = filePath;
        Order = order;
    }

    public int CompareTo(FileEntry? other) => Order.CompareTo(other?.Order);

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
