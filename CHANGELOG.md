# Değişiklik Günlüğü (Changelog)

## [2.5.1] - 2026-04-13

### Düzeltildi
- **Office COM Yaşam Döngüsü:** Word ve Excel dönüştürmelerinde COM nesneleri artık aynı STA iş parçacığı üzerinde oluşturulup temizlenir. Bu sayede çapraz thread temizleme kaynaklı kilitlenme ve süreç sızıntısı riski azaltıldı.
- **STA Yardımcısı:** `StaTask`, zaman aşımıyla hataya düşüp arka planda çalışmaya devam eden davranış yerine STA işini tamamlanana kadar bekleyecek şekilde sadeleştirildi.
- **Numarasız Dosyalar:** Numarasız dosyalar artık listede `Numarasız` olarak gösterilir, sıralamada en sona atılır ve damgalama sırasında boş numara ile işaretlenmez.
- **Buton Yenileme:** Dosya listesi değiştiğinde komut durumu yeniden değerlendirilerek butonların gri kalma ihtimali azaltıldı.

### Doğrulandı
- **Derleme Kontrolü:** Proje `dotnet build` ile başarıyla derlendi.
- **Gerçek Excel Senaryosu:** `1.6. Dorse Bakım Raporu.xlsx` dosyası ile Excel'den PDF'e dönüştürme başarıyla çalıştı ve işlem sonrasında artıkta kalan `EXCEL` süreci gözlenmedi.

## [2.5.0] - 2026-04-07

### Eklendi
- **Başlangıç Temizliği:** Uygulama açılışında önceki çalışmalardan kalan geçici dosyalar otomatik temizlenir.
- **MagnifyWindow:** Büyütme önizlemesi artık XAML tabanlı ayrı bir pencere olarak tanımlanmıştır.
- **TempFile Yardımcı Sınıfı:** Geçici dosya yolu oluşturma tek bir merkezden yönetilir.
- **COM Zaman Aşımı:** Word ve Excel dönüştürme işlemlerinde 2 dakikalık zaman aşımı eklendi; Office takılırsa uygulama donmaz.
- **Tema Renk Kaynakları:** `WarningText` ve `MagnifyOverlay` renkleri App.xaml kaynaklarına taşındı.

### Düzeltildi
- **Thread Safety:** Koleksiyonlar arka plan iş parçacığına geçmeden önce kopyalanarak yarış durumu önlendi.
- **Bellek Sızıntısı:** `MainWindow` kapanışında `PropertyChanged` olay aboneliği kaldırılarak düzeltildi.
- **async void:** `MagnifyPage` metodu `async Task` olarak değiştirildi.
- **TOCTOU:** `File.Exists` kontrolü kaldırılarak dosya silme yarış durumu düzeltildi.
- **XGraphics Sızıntısı:** `MsgToPdfConverter` içinde `XGraphics` nesnesi `try/finally` ile korundu.
- **Boş Catch Blokları:** 9 adet sessiz `catch { }` bloğu `Debug.WriteLine` ile loglama eklenerek güncellendi.
- **Sürüm Uyuşmazlığı:** Hakkında penceresinde sabit sürüm numarası yerine derleme sürümü dinamik olarak gösterilir.

### Değiştirildi
- **Süreç Argümanları:** PdfCompressor'da Ghostscript/QPDF argümanları `ArgumentList` koleksiyonu ile geçirilir.
- **Dosya Boyutu Eşiği:** 11 MB uyarı eşiği `FileSizeWarningThresholdMB` sabiti olarak tanımlandı.

---

## [2.1.0] - 2026-04-02

### Eklendi
- **Koyu Tema:** Tamamen yeniden tasarlanmış koyu tema arayüz.
- **PDF Sıkıştırma:** Ghostscript ve QPDF ile üç sıkıştırma seçeneği: düşük, yüksek ve özel (DPI ve JPEG kalitesi ayarlanabilir). Araçlar uygulama ile birlikte gelir, ek kurulum gerektirmez.
- **3 Aşamalı İş Akışı:** Dosya listesi → önizleme → özet sayfası. Özet sayfasında dosya boyutu, sayfa sayısı, sıkıştırma seçenekleri ve önizleme/kaydetme butonları yer alır.
- **Sayfa Döndürme:** Önizleme sayfasında her sayfa için 90 derece saat yönünde döndürme. Döndürme fiziksel olarak uygulanır (koordinat sistemi dönüşür), damga her zaman doğru köşeye yerleşir.
- **Büyütme Önizleme:** Önizleme sayfasında her sayfayı büyüterek inceleme. Koyu arka planlı kenarsız pencerede açılır, tıklama veya Escape ile kapanır.
- **JFIF Desteği:** `.jfif` görsel formatı artık destekleniyor.
- **Dosya Boyutu Uyarısı:** 11 MB üzerindeki çıktılar için kırmızı renkte "Yüksek dosya boyutu" uyarısı.
- **Akıllı Damgalama:** Aynı sıra numarasına sahip birden fazla dosyada yalnızca ilk dosyanın ilk sayfasına damga vurulur.
- **Önizlemede Dosya Adları:** Küçük resim önizlemelerinin altında sıra numarası yerine dosya adları gösterilir.

### Değiştirildi
- **Office Interop:** Sürüm bağımlı NuGet paketleri kaldırıldı, yerine late-binding COM (`dynamic`) kullanıldı. Artık tüm Office sürümleriyle (2013, 2016, 2019, 365) çalışır.
- **Damga Stili:** Yarı saydam gri daire (%40 opaklık arka plan, %70 opaklık metin), gölge kaldırıldı.
- **Modern Arayüz:** Yuvarlak köşeler, ince kaydırma çubukları, dairesel butonlar (döndürme/büyütme), koyu tema renk paleti, modern tooltip stili.

### Düzeltildi
- **Buton Durumu:** Sürükle-bırak sonrası ve sayfa geçişlerinde butonların gri kalma sorunu düzeltildi (`CommandManager.InvalidateRequerySuggested`).
- **Döndürme ve Damga:** `Page.Rotate` bayrağı yerine fiziksel döndürme uygulandı. Damga artık döndürülmüş sayfanın gerçek sol üst köşesine yerleşir.
- **Pencere Arka Planı:** WPF implicit `Window` stili uygulanmama sorunu düzeltildi (`Background` açıkça eklendi).

---

## [Yayınlanmamış - Önceki Sürümler]

### Eklendi
- **MSG Dosya Desteği:** Artık Outlook (`.msg`) dosyalarını sürükleyip bırakarak PDF'e dönüştürebilirsiniz.
- **Güvenli Dönüştürme:** Dosya yollarındaki Türkçe ve özel karakter sorunlarını çözen güvenli kopyalama mekanizması.
- **PDF Sıkıştırma:** "Oluştur" aşamasından sonra dosyaları farklı kalite ayarlarında sıkıştırarak boyutunu küçültme özelliği.
- **Yeni Arayüz:** Modern, koyu temalı kullanıcı arayüzü.
- **Doğrulama Sistemi:** Numarasız veya desteklenmeyen dosyalar için akıllı uyarı ve doğrulama sistemi.
- **Uygulama Simgesi:** Yeni, modern ve profesyonel uygulama simgesi.

### Düzeltildi
- **Detached ArrayBuffer Hatası:** PDF işleme sırasında oluşan hafıza yönetim hatası giderildi.
- **Race Condition:** Önizleme ekranında hızlı geçişlerde oluşan çakışma hatası giderildi.
- **EBUSY Hataları:** Dosya silme ve taşıma işlemlerinde oluşan kilitlenme sorunları çözüldü.
