using System.IO;
using Numaralandirici.Services.Converters;

namespace Numaralandirici.Services;

public static class FileConverter
{
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".tif",
        ".doc", ".docx", ".xls", ".xlsx", ".msg"
    };

    public static bool IsSupported(string filePath)
    {
        var ext = Path.GetExtension(filePath);
        return SupportedExtensions.Contains(ext);
    }

    public static string ConvertToPdf(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".pdf" => PdfPassthroughConverter.Normalize(filePath),
            ".jpg" or ".jpeg" or ".png" or ".bmp" or ".gif" or ".tiff" or ".tif"
                => ImageToPdfConverter.Convert(filePath),
            ".doc" or ".docx" => WordToPdfConverter.Convert(filePath),
            ".xls" or ".xlsx" => ExcelToPdfConverter.Convert(filePath),
            ".msg" => MsgToPdfConverter.Convert(filePath),
            _ => throw new NotSupportedException($"Desteklenmeyen dosya türü: {ext}")
        };
    }
}
