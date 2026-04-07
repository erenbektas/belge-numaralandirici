using System.IO;
using Numaralandirici.Helpers;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace Numaralandirici.Services.Converters;

public static class PdfPassthroughConverter
{
    public static string Normalize(string pdfPath)
    {
        var tempPath = TempFile.NewPdf();

        // Check if all pages are already A4
        using var inputDoc = PdfReader.Open(pdfPath, PdfDocumentOpenMode.Import);
        bool allA4 = true;
        for (int i = 0; i < inputDoc.PageCount; i++)
        {
            var p = inputDoc.Pages[i];
            if (Math.Abs(p.Width.Point - A4Constants.WidthPoints) > 1 ||
                Math.Abs(p.Height.Point - A4Constants.HeightPoints) > 1)
            {
                allA4 = false;
                break;
            }
        }

        if (allA4)
        {
            // Just copy the file
            File.Copy(pdfPath, tempPath, true);
            return tempPath;
        }

        // Need to scale pages
        using var outputDoc = new PdfDocument();
        using var form = XPdfForm.FromFile(pdfPath);

        for (int i = 0; i < form.PageCount; i++)
        {
            PdfPageScaler.ScalePageToA4(outputDoc, form, i);
        }

        outputDoc.Save(tempPath);
        return tempPath;
    }
}
