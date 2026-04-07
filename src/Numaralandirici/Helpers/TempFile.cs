using System.IO;

namespace Numaralandirici.Helpers;

public static class TempFile
{
    public static string NewPdf(string suffix = "")
    {
        var name = string.IsNullOrEmpty(suffix)
            ? $"numaralandirici_{Guid.NewGuid()}.pdf"
            : $"numaralandirici_{suffix}_{Guid.NewGuid()}.pdf";
        return Path.Combine(Path.GetTempPath(), name);
    }
}
