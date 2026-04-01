using Numaralandirici.Helpers;
using PdfSharp;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace Numaralandirici.Services;

public static class PdfPageScaler
{
    public static void ScalePageToA4(PdfDocument outputDoc, XPdfForm form, int pageIndex)
    {
        form.PageIndex = pageIndex;
        var page = outputDoc.AddPage();
        page.Width = XUnitPt.FromPoint(A4Constants.WidthPoints);
        page.Height = XUnitPt.FromPoint(A4Constants.HeightPoints);

        double origWidth = form.PointWidth;
        double origHeight = form.PointHeight;

        // Already A4 (within tolerance)
        bool isA4 = Math.Abs(origWidth - A4Constants.WidthPoints) < 1 &&
                    Math.Abs(origHeight - A4Constants.HeightPoints) < 1;

        using var gfx = XGraphics.FromPdfPage(page);

        if (isA4)
        {
            gfx.DrawImage(form, 0, 0, A4Constants.WidthPoints, A4Constants.HeightPoints);
        }
        else
        {
            double scaleX = A4Constants.WidthPoints / origWidth;
            double scaleY = A4Constants.HeightPoints / origHeight;
            double scale = Math.Min(scaleX, scaleY);

            double scaledWidth = origWidth * scale;
            double scaledHeight = origHeight * scale;
            double offsetX = (A4Constants.WidthPoints - scaledWidth) / 2;
            double offsetY = (A4Constants.HeightPoints - scaledHeight) / 2;

            gfx.DrawImage(form, offsetX, offsetY, scaledWidth, scaledHeight);
        }
    }
}
