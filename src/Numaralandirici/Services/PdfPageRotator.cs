using Numaralandirici.Helpers;
using PdfSharp;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace Numaralandirici.Services;

public static class PdfPageRotator
{
    /// <summary>
    /// Physically rotates a page by re-rendering its content onto a new page.
    /// The coordinate system of the new page is fully transformed - (0,0) is the new top-left.
    /// </summary>
    public static PdfPage RotatePage(PdfDocument outputDoc, XPdfForm form, int pageIndex, int rotation)
    {
        form.PageIndex = pageIndex;

        double origWidth = form.PointWidth;
        double origHeight = form.PointHeight;

        bool swapDimensions = rotation == 90 || rotation == 270;
        double newWidth = swapDimensions ? origHeight : origWidth;
        double newHeight = swapDimensions ? origWidth : origHeight;

        var page = outputDoc.AddPage();
        page.Width = XUnitPt.FromPoint(newWidth);
        page.Height = XUnitPt.FromPoint(newHeight);

        using var gfx = XGraphics.FromPdfPage(page);

        // Apply rotation transform around appropriate pivot
        switch (rotation)
        {
            case 90:
                gfx.TranslateTransform(newWidth, 0);
                gfx.RotateTransform(90);
                break;
            case 180:
                gfx.TranslateTransform(newWidth, newHeight);
                gfx.RotateTransform(180);
                break;
            case 270:
                gfx.TranslateTransform(0, newHeight);
                gfx.RotateTransform(270);
                break;
        }

        gfx.DrawImage(form, 0, 0, origWidth, origHeight);

        return page;
    }
}
