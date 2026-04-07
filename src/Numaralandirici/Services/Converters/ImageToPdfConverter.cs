using Numaralandirici.Helpers;
using PdfSharp;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace Numaralandirici.Services.Converters;

public static class ImageToPdfConverter
{
    public static string Convert(string imagePath)
    {
        var tempPath = TempFile.NewPdf();
        using var document = new PdfDocument();
        var page = document.AddPage();
        page.Width = XUnitPt.FromPoint(A4Constants.WidthPoints);
        page.Height = XUnitPt.FromPoint(A4Constants.HeightPoints);

        using var gfx = XGraphics.FromPdfPage(page);
        using var image = XImage.FromFile(imagePath);

        double scaleX = A4Constants.WidthPoints / image.PointWidth;
        double scaleY = A4Constants.HeightPoints / image.PointHeight;
        double scale = Math.Min(scaleX, scaleY);

        double scaledWidth = image.PointWidth * scale;
        double scaledHeight = image.PointHeight * scale;
        double offsetX = (A4Constants.WidthPoints - scaledWidth) / 2;
        double offsetY = (A4Constants.HeightPoints - scaledHeight) / 2;

        gfx.DrawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

        document.Save(tempPath);
        return tempPath;
    }
}
