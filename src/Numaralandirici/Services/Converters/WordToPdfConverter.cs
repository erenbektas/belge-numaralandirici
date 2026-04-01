using System.IO;
using System.Runtime.InteropServices;
using Word = Microsoft.Office.Interop.Word;

namespace Numaralandirici.Services.Converters;

public static class WordToPdfConverter
{
    public static string Convert(string wordPath)
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"numaralandirici_{Guid.NewGuid()}.pdf");
        Word.Application? wordApp = null;
        Word.Document? doc = null;

        try
        {
            wordApp = new Word.Application { Visible = false, DisplayAlerts = Word.WdAlertLevel.wdAlertsNone };
            doc = wordApp.Documents.Open(
                Path.GetFullPath(wordPath),
                ReadOnly: true,
                Visible: false);

            doc.ExportAsFixedFormat(
                tempPath,
                Word.WdExportFormat.wdExportFormatPDF,
                OptimizeFor: Word.WdExportOptimizeFor.wdExportOptimizeForPrint);
        }
        finally
        {
            if (doc != null)
            {
                doc.Close(Word.WdSaveOptions.wdDoNotSaveChanges);
                Marshal.ReleaseComObject(doc);
            }
            if (wordApp != null)
            {
                wordApp.Quit(Word.WdSaveOptions.wdDoNotSaveChanges);
                Marshal.ReleaseComObject(wordApp);
            }
        }

        // Normalize to A4
        var normalized = PdfPassthroughConverter.Normalize(tempPath);
        if (normalized != tempPath)
        {
            try { File.Delete(tempPath); } catch { }
        }
        return normalized;
    }
}
