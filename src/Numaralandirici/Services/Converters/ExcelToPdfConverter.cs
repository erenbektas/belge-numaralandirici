using System.IO;
using System.Runtime.InteropServices;
using Excel = Microsoft.Office.Interop.Excel;

namespace Numaralandirici.Services.Converters;

public static class ExcelToPdfConverter
{
    public static string Convert(string excelPath)
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"numaralandirici_{Guid.NewGuid()}.pdf");
        Excel.Application? excelApp = null;
        Excel.Workbook? workbook = null;

        try
        {
            excelApp = new Excel.Application { Visible = false, DisplayAlerts = false };
            workbook = excelApp.Workbooks.Open(
                Path.GetFullPath(excelPath),
                ReadOnly: true);

            // Set all sheets to A4
            foreach (Excel.Worksheet sheet in workbook.Worksheets)
            {
                sheet.PageSetup.PaperSize = Excel.XlPaperSize.xlPaperA4;
                sheet.PageSetup.FitToPagesWide = 1;
                sheet.PageSetup.FitToPagesTall = false;
                Marshal.ReleaseComObject(sheet);
            }

            workbook.ExportAsFixedFormat(
                Excel.XlFixedFormatType.xlTypePDF,
                tempPath);
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
