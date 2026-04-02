# Değişiklik Günlüğü (Changelog)

## [2.0.0] - 2026-04-02

### Eklendi
- **Koyu Tema:** Tamamen yeniden tasarlanmış koyu tema arayüz. Karanlık başlık çubuğu desteği (DWM API).
- **PDF Sıkıştırma:** Ghostscript ve QPDF ile üç sıkıştırma seçeneği: düşük, yüksek ve özel (DPI ve JPEG kalitesi ayarlanabilir). Araçlar uygulama ile birlikte gelir, ek kurulum gerektirmez.
- **3 Aşamalı İş Akışı:** Dosya listesi → önizleme → özet sayfası. Özet sayfasında dosya boyutu, sayfa sayısı, sıkıştırma seçenekleri ve önizleme/kaydetme butonları yer alır.
- **Sayfa Döndürme:** Önizleme sayfasında her sayfa için 90 derece saat yönünde döndürme. Döndürme fiziksel olarak uygulanır (koordinat sistemi dönüşür), damga her zaman doğru köşeye yerleşir.
- **Büyütme Önizleme:** Önizleme sayfasında her sayfayı büyüterek inceleme. Koyu arka planlı kenarsız pencerede açılır, tıklama veya Escape ile kapanır.
- **JFIF Desteği:** .jfif görsel formatı artık destekleniyor.
- **Dosya Boyutu Uyarısı:** 11 MB üzerindeki çıktılar için kırmızı renkte "Yüksek dosya boyutu" uyarısı.
- **Akıllı Damgalama:** Aynı sıra numarasına sahip birden fazla dosyada yalnızca ilk dosyanın ilk sayfasına damga vurulur.
- **Önizlemede Dosya Adları:** Küçük resim önizlemelerinin altında sıra numarası yerine dosya adları gösterilir.

### Değiştirildi
- **Office Interop:** Sürüm bağımlı NuGet paketleri kaldırıldı, yerine late-binding COM (dynamic) kullanıldı. Artık tüm Office sürümleriyle (2013, 2016, 2019, 365) çalışır.
- **Damga Stili:** Yarı saydam gri daire (%40 opaklık arka plan, %70 opaklık metin), gölge kaldırıldı.
- **Modern Arayüz:** Yuvarlak köşeler, ince kaydırma çubukları, dairesel butonlar (döndürme/büyütme), koyu tema renk paleti, modern tooltip stili.
- **Dosya Listesi:** Silme butonu en sol sütuna taşındı ve kırmızı arka planlı hale getirildi. "Dosya Adı" sütunu pencere genişliğine göre otomatik genişler. Başlık satırı saydam arka planlı ve hover efekti kaldırıldı.

### Düzeltildi
- **Buton Durumu:** Sürükle-bırak sonrası ve sayfa geçişlerinde butonların gri kalma sorunu düzeltildi (CommandManager.InvalidateRequerySuggested).
- **Döndürme ve Damga:** Page.Rotate bayrağı yerine fiziksel döndürme uygulandı. Damga artık döndürülmüş sayfanın gerçek sol üst köşesine yerleşir.
- **Pencere Arka Planı:** WPF implicit Window stili uygulanmama sorunu düzeltildi (explicit Background eklendi).

---

## [Yayınlanmamış - Önceki Sürümler]

### Eklendi
- **MSG Dosya Desteği:** Artık Outlook (.msg) dosyalarını sürükleyip bırakarak PDF'e dönüştürebilirsiniz.
- **Güvenli Dönüştürme:** Dosya yollarındaki Türkçe ve özel karakter sorunlarını çözen güvenli kopyalama mekanizması.
- **PDF Sıkıştırma:** "Oluştur" aşamasından sonra dosyaları farklı kalite ayarlarında sıkıştırarak boyutunu küçültme özelliği.
- **Yeni Arayüz:** Modern, koyu temalı kullanıcı arayüzü.
- **Doğrulama Sistemi:** Numarasız veya desteklenmeyen dosyalar için akıllı uyarı ve doğrulama sistemi.
- **Uygulama Simgesi:** Yeni, modern ve profesyonel uygulama simgesi.

### Düzeltildi
- **Detached ArrayBuffer Hatası:** PDF işleme sırasında oluşan hafıza yönetim hatası giderildi.
- **Race Condition:** Önizleme ekranında hızlı geçişlerde oluşan çakışma hatası giderildi.
- **EBUSY Hataları:** Dosya silme ve taşıma işlemlerinde oluşan kilitlenme sorunları çözüldü.
