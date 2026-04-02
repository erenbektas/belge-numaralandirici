using System.IO;
using System.Runtime.InteropServices;

namespace Numaralandirici.Services.Converters;

public static class WordToPdfConverter
{
    public static string Convert(string wordPath)
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"numaralandirici_{Guid.NewGuid()}.pdf");
        dynamic? wordApp = null;
        dynamic? doc = null;

        try
        {
            var wordType = Type.GetTypeFromProgID("Word.Application")
                ?? throw new Exception("Microsoft Word yüklü değil.");

            wordApp = Activator.CreateInstance(wordType)!;
            wordApp.Visible = false;
            wordApp.DisplayAlerts = 0; // wdAlertsNone

            doc = wordApp.Documents.Open(
                Path.GetFullPath(wordPath),
                ReadOnly: true,
                Visible: false);

            // wdExportFormatPDF = 17, wdExportOptimizeForPrint = 0
            doc.ExportAsFixedFormat(tempPath, 17, OptimizeFor: 0);
        }
        finally
        {
            if (doc != null)
            {
                doc.Close(0); // wdDoNotSaveChanges
                Marshal.ReleaseComObject(doc);
            }
            if (wordApp != null)
            {
                wordApp.Quit(0); // wdDoNotSaveChanges
                Marshal.ReleaseComObject(wordApp);
            }
        }

        var normalized = PdfPassthroughConverter.Normalize(tempPath);
        if (normalized != tempPath)
        {
            try { File.Delete(tempPath); } catch { }
        }
        return normalized;
    }
}
