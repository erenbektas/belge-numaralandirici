using System.Text;
using System.Text.RegularExpressions;
using MsgReader.Outlook;
using Numaralandirici.Helpers;
using PdfSharp;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace Numaralandirici.Services.Converters;

public static partial class MsgToPdfConverter
{
    public static string Convert(string msgPath)
    {
        var tempPath = TempFile.NewPdf();

        using var msg = new Storage.Message(msgPath);

        string from = msg.Sender?.Email ?? msg.Sender?.DisplayName ?? "";
        string to = "";
        try
        {
            var recipients = msg.Recipients;
            if (recipients != null)
            {
                to = string.Join("; ", recipients
                    .Select(r => !string.IsNullOrEmpty(r.Email) ? r.Email : r.DisplayName));
            }
        }
        catch
        {
            to = "(alicilar okunamadi)";
        }
        string date = msg.SentOn?.ToString("dd.MM.yyyy HH:mm") ?? "";
        string subject = msg.Subject ?? "";

        string body = msg.BodyText ?? "";
        if (string.IsNullOrWhiteSpace(body) && !string.IsNullOrWhiteSpace(msg.BodyHtml))
        {
            body = StripHtml(msg.BodyHtml);
        }

        using var document = new PdfDocument();
        var font = new XFont("Arial", 10);
        var boldFont = new XFont("Arial", 10, XFontStyleEx.Bold);
        var headerFont = new XFont("Arial", 12, XFontStyleEx.Bold);

        double margin = 40;
        double lineHeight = 14;
        double maxWidth = A4Constants.WidthPoints - margin * 2;
        double y = margin;

        PdfPage page = AddA4Page(document);
        XGraphics gfx = XGraphics.FromPdfPage(page);

        try
        {
            // Draw header
            y = DrawLine(gfx, boldFont, $"Kimden: {from}", margin, y, maxWidth, lineHeight);
            y = DrawLine(gfx, boldFont, $"Kime: {to}", margin, y, maxWidth, lineHeight);
            y = DrawLine(gfx, boldFont, $"Tarih: {date}", margin, y, maxWidth, lineHeight);
            y = DrawLine(gfx, headerFont, $"Konu: {subject}", margin, y, maxWidth, lineHeight + 4);
            y += 10;

            // Draw separator line
            gfx.DrawLine(XPens.Gray, margin, y, A4Constants.WidthPoints - margin, y);
            y += 15;

            // Draw body text with word wrap and pagination
            var lines = body.Split('\n');
            foreach (var rawLine in lines)
            {
                var line = rawLine.TrimEnd('\r');
                var wrappedLines = WrapText(gfx, font, line, maxWidth);

                foreach (var wl in wrappedLines)
                {
                    if (y + lineHeight > A4Constants.HeightPoints - margin)
                    {
                        gfx.Dispose();
                        page = AddA4Page(document);
                        gfx = XGraphics.FromPdfPage(page);
                        y = margin;
                    }
                    gfx.DrawString(wl, font, XBrushes.Black, new XPoint(margin, y));
                    y += lineHeight;
                }
            }
        }
        finally
        {
            gfx.Dispose();
        }

        document.Save(tempPath);
        return tempPath;
    }

    private static PdfPage AddA4Page(PdfDocument document)
    {
        var page = document.AddPage();
        page.Width = XUnitPt.FromPoint(A4Constants.WidthPoints);
        page.Height = XUnitPt.FromPoint(A4Constants.HeightPoints);
        return page;
    }

    private static double DrawLine(XGraphics gfx, XFont font, string text, double x, double y, double maxWidth, double lineHeight)
    {
        var lines = WrapText(gfx, font, text, maxWidth);
        foreach (var line in lines)
        {
            gfx.DrawString(line, font, XBrushes.Black, new XPoint(x, y));
            y += lineHeight;
        }
        return y;
    }

    private static List<string> WrapText(XGraphics gfx, XFont font, string text, double maxWidth)
    {
        var result = new List<string>();
        if (string.IsNullOrEmpty(text))
        {
            result.Add("");
            return result;
        }

        var words = text.Split(' ');
        var currentLine = new StringBuilder();

        foreach (var word in words)
        {
            string test = currentLine.Length == 0 ? word : $"{currentLine} {word}";
            if (gfx.MeasureString(test, font).Width <= maxWidth)
            {
                currentLine.Clear();
                currentLine.Append(test);
            }
            else
            {
                if (currentLine.Length > 0)
                {
                    result.Add(currentLine.ToString());
                    currentLine.Clear();
                }
                currentLine.Append(word);
            }
        }

        if (currentLine.Length > 0)
            result.Add(currentLine.ToString());

        if (result.Count == 0)
            result.Add("");

        return result;
    }

    private static string StripHtml(string html)
    {
        // Remove style and script blocks
        var cleaned = Regex.Replace(html, @"<(style|script)[^>]*>[\s\S]*?</\1>", "", RegexOptions.IgnoreCase);
        // Replace <br> and <p> with newlines
        cleaned = Regex.Replace(cleaned, @"<br\s*/?>", "\n", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"</p>", "\n", RegexOptions.IgnoreCase);
        // Remove all other tags
        cleaned = Regex.Replace(cleaned, @"<[^>]+>", "");
        // Decode entities
        cleaned = System.Net.WebUtility.HtmlDecode(cleaned);
        // Normalize whitespace
        cleaned = Regex.Replace(cleaned, @"\r\n", "\n");
        cleaned = Regex.Replace(cleaned, @"\n{3,}", "\n\n");
        return cleaned.Trim();
    }
}
