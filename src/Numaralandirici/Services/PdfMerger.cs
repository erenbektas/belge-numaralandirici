using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace Numaralandirici.Services;

public static class PdfMerger
{
    public static void Merge(IEnumerable<string> pdfPaths, string outputPath)
    {
        using var outputDocument = new PdfDocument();

        foreach (var path in pdfPaths)
        {
            using var inputDocument = PdfReader.Open(path, PdfDocumentOpenMode.Import);
            for (int i = 0; i < inputDocument.PageCount; i++)
            {
                outputDocument.AddPage(inputDocument.Pages[i]);
            }
        }

        outputDocument.Save(outputPath);
    }
}
