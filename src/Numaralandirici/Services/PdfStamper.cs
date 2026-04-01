using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace Numaralandirici.Services;

public static class PdfStamper
{
    public static void StampFirstPage(PdfDocument document, string orderText)
    {
        if (document.PageCount == 0 || string.IsNullOrWhiteSpace(orderText))
            return;

        var page = document.Pages[0];
        using var gfx = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Append);

        var font = new XFont("Arial", 14, XFontStyleEx.Bold);
        var textSize = gfx.MeasureString(orderText, font);

        double padding = 8;
        double diameter = Math.Max(textSize.Width, textSize.Height) + padding * 2;
        double centerX = 15 + diameter / 2;
        double centerY = 15 + diameter / 2;

        // Gray circle background at 40% opacity
        var circleBrush = new XSolidBrush(XColor.FromArgb(102, 160, 160, 160));
        gfx.DrawEllipse(circleBrush,
            centerX - diameter / 2,
            centerY - diameter / 2,
            diameter, diameter);

        // Text at 70% opacity
        var textBrush = new XSolidBrush(XColor.FromArgb(179, 0, 0, 0));
        gfx.DrawString(orderText, font, textBrush,
            new XRect(centerX - textSize.Width / 2, centerY - textSize.Height / 2,
                       textSize.Width, textSize.Height),
            XStringFormats.TopLeft);
    }
}
