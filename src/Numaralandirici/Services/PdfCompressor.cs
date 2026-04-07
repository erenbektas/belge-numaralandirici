using System.Diagnostics;
using System.IO;
using Numaralandirici.Helpers;

namespace Numaralandirici.Services;

public static class PdfCompressor
{
    public static async Task<string> CompressAsync(string inputPdf, int dpi, int jpegQuality, IProgress<string>? progress = null)
    {
        string appDir = AppContext.BaseDirectory;
        string gsPath = Path.Combine(appDir, "tools", "gs", "gswin64c.exe");
        string qpdfPath = Path.Combine(appDir, "tools", "qpdf", "qpdf.exe");

        if (!File.Exists(gsPath))
            throw new FileNotFoundException("Ghostscript bulunamadı: " + gsPath);
        if (!File.Exists(qpdfPath))
            throw new FileNotFoundException("QPDF bulunamadı: " + qpdfPath);

        string tempCompressed = TempFile.NewPdf("gs");
        string tempOptimized = TempFile.NewPdf("qpdf");

        try
        {
            // Step 1: Ghostscript compression
            progress?.Report("Ghostscript ile sıkıştırılıyor...");

            await RunProcessAsync(gsPath,
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.5",
                "-dPDFSETTINGS=/ebook",
                "-dDownsampleColorImages=true",
                $"-dColorImageResolution={dpi}",
                $"-dJPEGQ={jpegQuality}",
                "-dNOPAUSE",
                "-dBATCH",
                $"-sOutputFile={tempCompressed}",
                inputPdf);

            if (!File.Exists(tempCompressed) || new FileInfo(tempCompressed).Length == 0)
                throw new Exception("Ghostscript çıktı dosyası oluşturulamadı.");

            // Step 2: QPDF linearization
            progress?.Report("QPDF ile optimize ediliyor...");

            await RunProcessAsync(qpdfPath,
                "--linearize",
                tempCompressed,
                tempOptimized);

            if (!File.Exists(tempOptimized) || new FileInfo(tempOptimized).Length == 0)
                throw new Exception("QPDF çıktı dosyası oluşturulamadı.");

            // Cleanup GS temp
            try { File.Delete(tempCompressed); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {tempCompressed} - {ex.Message}"); }

            return tempOptimized;
        }
        catch
        {
            try { File.Delete(tempCompressed); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {tempCompressed} - {ex.Message}"); }
            try { File.Delete(tempOptimized); } catch (Exception ex) { Debug.WriteLine($"Temp dosya silinemedi: {tempOptimized} - {ex.Message}"); }
            throw;
        }
    }

    private static async Task RunProcessAsync(string exePath, params string[] args)
    {
        var psi = new ProcessStartInfo
        {
            FileName = exePath,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        foreach (var arg in args)
            psi.ArgumentList.Add(arg);

        using var process = Process.Start(psi)
            ?? throw new Exception($"İşlem başlatılamadı: {exePath}");

        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
        {
            string error = await process.StandardError.ReadToEndAsync();
            throw new Exception($"{Path.GetFileName(exePath)} hatası (kod {process.ExitCode}): {error}");
        }
    }
}
