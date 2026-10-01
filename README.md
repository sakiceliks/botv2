# İLANLA

Google Lens + Groq + Puppeteer ile araç parçası görselinden sahibinden ilan akışı oluşturan Next.js uygulaması.

## Özellikler

- Tek ekranlı kontrol merkezi
- Tarayıcıyı aç / sahibinden oturum aç / ilan ver sayfasını aç butonları
- Sahibinden oturum durumu kontrolü ve UI rozeti
- Görsel yükleme
- imgbb ile public preview URL oluşturma
- SerpApi Google Lens entegrasyonu
- Groq ile normalize ilan JSON üretimi
- Kategori ve araç tipi için deterministic fallback
- Düşük güvenli alanlar için önizleme ve kullanıcı onayı
- Puppeteer görünür Chrome ile `draft` ve `publish` modları
- Silinmeyen yayın logu ve "Yayın Geçmişi" ekranı
- Mükerrer ilan koruması (benzersiz başlık kodu, tekrar deneme koruması, görsel tekrar uyarısı)

## Gerekli ortam değişkenleri

`.env.local` oluşturup aşağıdaki değerleri doldur:

```bash
SERPAPI_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
IMGBB_API_KEY=
PUPPETEER_USER_DATA_DIR=./chrome-profile
CHROME_EXECUTABLE_PATH=
FIXED_LISTING_PRICE=1111
FIXED_LISTING_DESCRIPTION=Parca temiz durumda olup detaylar icin iletisime gecebilirsiniz.
MONGODB_URI=            # kuyruk ve yayın logu yedeği
PUBLISH_LOG_DIR=        # opsiyonel, varsayılan data/publish-log
```

## Kurulum

Bu ortamda `node` ve `npm` bulunmadığı için komutları burada çalıştıramadım. Kendi makinede:

```bash
npm install
npm run dev
```

Ardından [http://localhost:3000](http://localhost:3000) adresini aç.

## Önerilen kullanım
1. `Tarayıcıyı aç` veya `Sahibinden oturum aç` butonuyla kalıcı profilli Chrome oturumu başlat.
2. `Profil durumunu kontrol et` ile rozetin `Giriş yapılmış` durumuna geldiğini doğrula.
3. Gerekirse sahibinden hesabında giriş yap.
4. Uygulamaya dönüp görsel yükle.
5. `Lens + Groq analizi başlat` ile taslak veriyi oluştur.
6. Önizlemede marka, model, araç tipi ve kategori yolunu kontrol et.
7. İstersen `Taslak olarak doldur`, istersen `Sahibinden'de yayınla`.

## Mock görsel klasör yapısı

Hızlı / Toplu ilan ekleme görselleri `mock-image/<model-klasörü>/<renk>/` altından alır. Görselin
bulunduğu renk klasörü ilanın rengini belirler. Model ve renk listesi `lib/manual-data.ts` içindeki
`BRANDS` ve `MODEL_COLORS` ile tanımlıdır; yeni renk eklenirse klasörü de aynı adla açılmalıdır.

| Model | Klasör | Renk klasörleri |
| --- | --- | --- |
| iPhone 18 Pro Max | `iphone-18-pro-max` | `siyah`, `gumus`, `mavi`, `bordo` |
| iPhone 18 Pro | `iphone-18-pro` | `siyah`, `gumus`, `mavi`, `bordo` |
| iPhone 17 Pro Max | `iphone-17-pro-max` | `gumus`, `lacivert`, `turuncu` |
| iPhone 17 Pro | `iphone-17-pro` | `gumus`, `lacivert`, `turuncu` |
| Xiaomi 17 Pro Max | `xiaomi-17-pro-max` | `siyah`, `beyaz`, `mor`, `yesil` |
| Xiaomi 17 Pro | `xiaomi-17-pro` | `siyah`, `beyaz`, `mor`, `yesil` |

## Yayın logu

- Kuyruktan yapılan her yayın denemesi (başarılı ya da hatalı) `data/publish-log/YYYY-MM.jsonl`
  dosyasına bir satır olarak eklenir ve MongoDB `publishlogs` koleksiyonuna yedeklenir.
- Kayıtta başlık, marka/model, renk, kapasite, fiyat, ilçe/mahalle, açıklama, görsel yolu ve hash'i,
  son URL, varsa ilan no, süre, deneme sayısı ve adım adım Puppeteer logları bulunur.
- Uygulamada silme yoktur; kuyruğu sıfırlamak logları etkilemez. Kayıtlar sol menüdeki
  **Yayın Geçmişi** ekranından aranabilir, her satırın adım logları açılıp kopyalanabilir.

## Mükerrer ilan koruması

- **Başlık kodu:** Hızlı/Toplu/Manuel eklemede her başlığın sonuna `K7Q2` gibi benzersiz bir kod eklenir.
  Yayından hemen önce sunucu, kodu olmayan başlığa kod ekler; daha önce yayınlanmış bir başlıkta kodu yeniler.
- **Tekrar deneme koruması:** Son onay adımı (adım-3) gönderildikten sonra hata olursa ilan tekrar
  denenmez ve "kontrol et" olarak işaretlenir; aynı kuyruk öğesi ikinci kez yayınlanmaz.
- **Görsel uyarısı:** sahibinden aynı fotoğrafın ikinci ilanda kullanılmasını da mükerrer sayar.
  Daha önce yayınlanmış bir görsel kuyrukta ve logda sarı uyarıyla işaretlenir (yayın engellenmez).

## Puppeteer notları

- Tarayıcı görünür çalışır.
- Login oturumu `PUPPETEER_USER_DATA_DIR` klasöründe korunur.
- Bu profil, senin normal Chrome profilinden ayrıdır.
- Normal Chrome'da zaten giris yapmis olsan bile İLANLA profilinde ilk kez ayrica giris yapman gerekir.
- İlk çalıştırmada sahibinden girişi kullanıcı tarafından tamamlanmalıdır.
- `draft` modu formu doldurur ve son yayın tıklamasından önce durur.
- `publish` modu düşük güvenli alanlar gözden geçirildikten sonra tam yayın akışını dener.

## Mevcut sınırlar


- Sahibinden selector’ları şu an verilen HTML örneklerine göre yazıldı.
- Fiyat ve açıklama global sabit değerlerden gelir.
- Ürün tipi eşlemesi ilk sürümde `tampon`, `far`, `stop` gibi temel kurallarla yapılıyor.
- Chrome yolu gerekirse `CHROME_EXECUTABLE_PATH` ile açıkça verilmelidir.
