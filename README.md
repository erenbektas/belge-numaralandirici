# Numaralandırıcı

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-12-239120?logo=csharp&logoColor=white)
![WPF](https://img.shields.io/badge/WPF-Desktop-0078D4?logo=windows&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows%20x64-0078D6?logo=windows&logoColor=white)
![PDFsharp](https://img.shields.io/badge/PDFsharp-6.1.1-E34F26?logo=adobeacrobatreader&logoColor=white)

Birden fazla dosya türünü PDF'e dönüştürüp numaralandıran ve tek bir PDF olarak birleştiren Windows masaüstü uygulaması.

## Ne Yapar?

Numaralandırıcı; PDF, Word, Excel, görsel ve Outlook (.msg) dosyalarını alır, hepsini PDF'e dönüştürür, her belgenin ilk sayfasına sıra numarasını damgalar ve doğru sıralamayla tek bir PDF'de birleştirir.

Sıralama, dosya adlarından otomatik olarak belirlenir. `1.pdf`, `2.1.docx`, `2.2-a.jpg` gibi adlandırmalar hiyerarşik olarak sıralanır (örn. `1` → `2.1` → `2.2.a`).

## Kullanım

1. **Dosya ekle** — sürükleyip bırakın veya dosya seçiciyi kullanın. Desteklenen formatlar: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), görseller (JPG, JPEG, JFIF, PNG, BMP, GIF, TIFF), Outlook (.msg).
2. **Önizleme** — tüm sayfalar birleştirme sırasına göre küçük resim olarak gösterilir. Sayfaları döndürebilir veya büyüterek inceleyebilirsiniz.
3. **Numaralandır** — her belgenin ilk sayfasına sıra numarası damgalanır (gri daire, sol üst köşe) ve tüm dosyalar tek bir PDF'de birleştirilir.
4. **Sıkıştır (isteğe bağlı)** — Ghostscript ve QPDF ile PDF dosyasını sıkıştırın. Düşük, yüksek veya özel sıkıştırma seçenekleri mevcuttur.
5. **Kaydet** — sonucu önizleyin veya diske kaydedin.

## Özellikler

- Koyu tema arayüz
- Dosya adlarından otomatik hiyerarşik sıralama
- 3 aşamalı iş akışı: dosya listesi → önizleme → özet
- Sayfa döndürme ve büyütme desteği
- Aynı sıra numarasına sahip dosyalarda yalnızca ilk dosyaya damga
- PDF sıkıştırma (Ghostscript + QPDF, uygulama ile birlikte gelir)
- Dosya boyutu uyarısı (11 MB üzeri)
- Tüm sayfalar A4'e ölçeklenir (kırpma yok)
- Office Interop sürüm bağımsız (tüm Office sürümleriyle çalışır)
- Bağımsız .exe olarak dağıtılabilir

## Gereksinimler

- Windows 10/11 (x64)
- .doc/.docx/.xls/.xlsx dönüşümü için Microsoft Office (Word ve Excel) yüklü olmalı
- .NET 8 runtime (self-contained derlemede dahildir)

## Derleme

```bash
dotnet build src/Numaralandirici/Numaralandirici.csproj
```

Tek bir self-contained çalıştırılabilir dosya olarak yayınlamak için:

```bash
dotnet publish src/Numaralandirici/Numaralandirici.csproj -c Release
```

## Proje Yapısı

```
src/Numaralandirici/
├── Models/
│   ├── FileEntry.cs          # Listedeki bir dosyayı temsil eder
│   ├── OrderPrefix.cs        # Dosya adından ayrıştırılan hiyerarşik sıra
│   └── PagePreview.cs        # Küçük resim önizleme modeli
├── ViewModels/
│   ├── MainViewModel.cs      # Uygulama mantığı ve durum yönetimi
│   └── RelayCommand.cs       # ICommand implementasyonu
├── Services/
│   ├── FileConverter.cs      # Dosyaları uygun dönüştürücülere yönlendirir
│   ├── FileNameParser.cs     # Dosya adlarından sıra öneklerini ayrıştırır
│   ├── PdfCompressor.cs      # Ghostscript + QPDF ile PDF sıkıştırma
│   ├── PdfMerger.cs          # Birden fazla PDF'i birleştirir
│   ├── PdfPageRotator.cs     # Sayfa döndürmesi uygular
│   ├── PdfPageScaler.cs      # Sayfaları A4'e ölçekler
│   ├── PdfStamper.cs         # İlk sayfalara sıra numarası damgalar
│   ├── PdfThumbnailGenerator.cs
│   └── Converters/
│       ├── ExcelToPdfConverter.cs
│       ├── ImageToPdfConverter.cs
│       ├── MsgToPdfConverter.cs
│       ├── PdfPassthroughConverter.cs
│       └── WordToPdfConverter.cs
├── Helpers/
│   └── A4Constants.cs
├── tools/
│   ├── gs/                   # Ghostscript (gswin64c.exe + gsdll64.dll)
│   └── qpdf/                 # QPDF (qpdf.exe + qpdf30.dll)
├── MainWindow.xaml           # Arayüz tasarımı
└── App.xaml                  # Uygulama kaynakları ve stiller
```

## Kullanılan Kütüphaneler

- [PDFsharp](https://github.com/empira/PDFsharp) — PDF oluşturma, düzenleme ve damgalama
- [PDFtoImage](https://github.com/sungaila/PDFtoImage) — PDF küçük resim üretimi
- [MsgReader](https://github.com/Sicos1977/MSGReader) — Outlook .msg dosya okuma
- [Ghostscript](https://www.ghostscript.com/) — PDF sıkıştırma ve görsel optimizasyonu
- [QPDF](https://github.com/qpdf/qpdf) — PDF linearizasyon ve optimizasyon
- Microsoft Office COM Interop — Word ve Excel'den PDF'e dönüşüm
