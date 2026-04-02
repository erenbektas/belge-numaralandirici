using System.IO;
using System.Runtime.InteropServices;

namespace Numaralandirici.Services.Converters;

public static class ExcelToPdfConverter
{
    public static string Convert(string excelPath)
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"numaralandirici_{Guid.NewGuid()}.pdf");
        dynamic? excelApp = null;
        dynamic? workbook = null;

        try
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
        }
        finally
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

        var normalized = PdfPassthroughConverter.Normalize(tempPath);
        if (normalized != tempPath)
        {
            try { File.Delete(tempPath); } catch { }
        }
        return normalized;
    }
}
