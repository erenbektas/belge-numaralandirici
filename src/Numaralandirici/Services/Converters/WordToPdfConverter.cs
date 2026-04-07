using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using Numaralandirici.Helpers;

namespace Numaralandirici.Services.Converters;

public static class WordToPdfConverter
{
    private static readonly TimeSpan Timeout = TimeSpan.FromMinutes(2);

    public static string Convert(string wordPath)
    {
        var tempPath = TempFile.NewPdf();
        dynamic? wordApp = null;
        dynamic? doc = null;

        try
        {
            var task = Task.Run(() =>
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
            });

            if (!task.Wait(Timeout))
                throw new TimeoutException($"Word dönüştürme zaman aşımına uğradı ({Timeout.TotalSeconds}s).");

            task.GetAwaiter().GetResult(); // propagate exceptions
        }
        finally
        {
            try
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
            catch (Exception ex)
            {
                Debug.WriteLine($"Word COM temizleme hatası: {ex.Message}");
            }
        }

        var normalized = PdfPassthroughConverter.Normalize(tempPath);
        if (normalized != tempPath)
        {
            try { File.Delete(tempPath); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {tempPath} - {ex.Message}"); }
        }
        return normalized;
    }
}
