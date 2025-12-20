# Değişiklik Günlüğü (Changelog)

## v1.5.0 - 2025-12-20

### Eklendi
- **MSG Dosya Desteği:** Artık Outlook (.msg) dosyalarını sürükleyip bırakarak PDF'e dönüştürebilirsiniz.
- **Güvenli Dönüştürme:** Dosya yollarındaki Türkçe ve özel karakter sorunlarını çözen güvenli kopyalama mekanizması.
- **PDF Sıkıştırma:** "Oluştur" aşamasından sonra dosyaları farklı kalite ayarlarında (Web, Standart, Baskı vb.) sıkıştırarak boyutunu küçültme özelliği.
- **Yeni Arayüz:** Modern, "Glassmorphism" (buzlu cam) efektli, koyu temalı ve şık kullanıcı arayüzü.
- **Doğrulama Sistemi:** Numarasız veya desteklenmeyen dosyalar için akıllı uyarı ve doğrulama sistemi.
- **Performans Optimizasyonu:** Akıllı önbellekleme sistemi sayesinde PDF dönüştürme ve önizleme hızları %90 artırıldı.
- **Uygulama Simgesi:** Yeni, modern ve profesyonel uygulama simgesi.

### Düzeltildi
- **Detached ArrayBuffer Hatası:** PDF işleme sırasında oluşan hafıza yönetim hatası giderildi.
- **Race Condition:** Önizleme ekranında hızlı geçişlerde oluşan çakışma hatası giderildi.
- **EBUSY Hataları:** Dosya silme ve taşıma işlemlerinde oluşan kilitlenme sorunları, geliştirilmiş kaynak yönetimi ile çözüldü.

### Değiştirildi
- **Dönüştürme Motoru:** Outlook → PDF dönüştürme işlemi daha kararlı olan MSG → HTML → Word → PDF akışına geçirildi.
