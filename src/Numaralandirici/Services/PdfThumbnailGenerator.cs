using System.IO;
using System.Windows.Media.Imaging;
using PDFtoImage;

namespace Numaralandirici.Services;

public static class PdfThumbnailGenerator
{
    public static Task<List<BitmapImage>> GenerateThumbnailsAsync(string pdfPath, int thumbnailWidth = 150)
    {
        return Task.Run(() =>
        {
            var thumbnails = new List<BitmapImage>();
            var pdfBytes = File.ReadAllBytes(pdfPath);
            var options = new RenderOptions(Width: thumbnailWidth, WithAspectRatio: true);

            int pageCount = Conversion.GetPageCount(pdfBytes);
            for (int i = 0; i < pageCount; i++)
            {
                thumbnails.Add(RenderPage(pdfBytes, i, options));
            }

            return thumbnails;
        });
    }

    public static Task<BitmapImage> GenerateSingleAsync(string pdfPath, int pageIndex, int width = 800)
    {
        return Task.Run(() =>
        {
            var pdfBytes = File.ReadAllBytes(pdfPath);
            var options = new RenderOptions(Width: width, WithAspectRatio: true);
            return RenderPage(pdfBytes, pageIndex, options);
        });
    }

    private static BitmapImage RenderPage(byte[] pdfBytes, int pageIndex, RenderOptions options)
    {
        using var stream = new MemoryStream();
        Conversion.SaveJpeg(stream, pdfBytes, pageIndex, options: options);
        stream.Position = 0;

        var bitmap = new BitmapImage();
        bitmap.BeginInit();
        bitmap.CacheOption = BitmapCacheOption.OnLoad;
        bitmap.StreamSource = stream;
        bitmap.EndInit();
        bitmap.Freeze();
        return bitmap;
    }
}
