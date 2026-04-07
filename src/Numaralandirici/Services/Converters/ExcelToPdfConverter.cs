using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using Numaralandirici.Helpers;

namespace Numaralandirici.Services.Converters;

public static class ExcelToPdfConverter
{
    private static readonly TimeSpan Timeout = TimeSpan.FromMinutes(2);

    public static string Convert(string excelPath)
    {
        var tempPath = TempFile.NewPdf();
        dynamic? excelApp = null;
        dynamic? workbook = null;

        try
        {
            var task = Task.Run(() =>
            {
                var excelType = Type.GetTypeFromProgID("Excel.Application")
                    ?? throw new Exception("Microsoft Excel yüklü değil.");

                excelApp = Activator.CreateInstance(excelType)!;
                excelApp.Visible = false;
                excelApp.DisplayAlerts = false;

                workbook = excelApp.Workbooks.Open(
                    Path.GetFullPath(excelPath),
                    ReadOnly: true);

                // Set all sheets to A4
                foreach (dynamic sheet in workbook.Worksheets)
                {
                    sheet.PageSetup.PaperSize = 9; // xlPaperA4
                    sheet.PageSetup.FitToPagesWide = 1;
                    sheet.PageSetup.FitToPagesTall = false;
                    Marshal.ReleaseComObject(sheet);
                }

                // xlTypePDF = 0
                workbook.ExportAsFixedFormat(0, tempPath);
            });

            if (!task.Wait(Timeout))
                throw new TimeoutException($"Excel dönüştürme zaman aşımına uğradı ({Timeout.TotalSeconds}s).");

            task.GetAwaiter().GetResult(); // propagate exceptions
        }
        finally
        {
            try
            {
                if (workbook != null)
                {
                    workbook.Close(false);
                    Marshal.ReleaseComObject(workbook);
                }
                if (excelApp != null)
                {
                    excelApp.Quit();
                    Marshal.ReleaseComObject(excelApp);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Excel COM temizleme hatası: {ex.Message}");
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
