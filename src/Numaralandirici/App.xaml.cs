using System.Diagnostics;
using System.IO;
using System.Windows;

namespace Numaralandirici;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        CleanupOrphanedTempFiles();
    }

    private static void CleanupOrphanedTempFiles()
    {
        try
        {
            var tempDir = Path.GetTempPath();
            var orphanedFiles = Directory.GetFiles(tempDir, "numaralandirici_*.pdf");

            foreach (var file in orphanedFiles)
            {
                try
                {
                    File.Delete(file);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Eski temp dosya silinemedi: {file} - {ex.Message}");
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Temp dosya temizleme hatası: {ex.Message}");
        }
    }
}
