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
bulunduğu renk klasörü ilanın rengini belirler. Marka, model ve renk listesi artık **Katalog**
ekranından (`data/catalog.json`) yönetilir — `lib/manual-data.ts`'teki `BRANDS`/`MODEL_COLORS` yalnızca
`data/catalog.json` hiç yoksa ilk kurulumda tohum (seed) verisi olarak kullanılır. Yeni bir renk
eklerken hem Katalog ekranından rengi tanımlayın hem de `mock-image/<model-klasörü>/<renk-slug>/`
klasörünü açın.

## Yayın logu

- Kuyruktan yapılan her yayın denemesi (başarılı ya da hatalı) `data/publish-log/YYYY-MM.jsonl`
  dosyasına bir satır olarak eklenir ve MongoDB `publishlogs` koleksiyonuna yedeklenir.
- Kayıtta başlık, marka/model, renk, kapasite, fiyat, ilçe/mahalle, açıklama, görsel yolu ve hash'i,
  son URL, varsa ilan no, süre, deneme sayısı ve adım adım Puppeteer logları bulunur.
- Uygulamada silme yoktur; kuyruğu sıfırlamak logları etkilemez. Kayıtlar sol menüdeki
  **Yayın Geçmişi** ekranından aranabilir, her satırın adım logları açılıp kopyalanabilir.

## Mükerrer ilan koruması

- **Başlık kodu:** Başlıklar normalde slogan/model/kapasite kombinasyonuyla zaten farklıdır. Yayından
  hemen önce sunucu, başlığı yayın logundaki geçmişle karşılaştırır; gerçek bir çakışma tespit ederse
  (aynı başlık daha önce yayınlanmış) sonuna `K7Q2` gibi kısa bir kod ekler. Çakışma yoksa başlığa
  dokunulmaz.
- **Tekrar deneme koruması:** Son onay adımı (adım-3) gönderildikten sonra hata olursa ilan tekrar
  denenmez ve "kontrol et" olarak işaretlenir; aynı kuyruk öğesi ikinci kez yayınlanmaz.
- **Görsel uyarısı:** sahibinden aynı fotoğrafın ikinci ilanda kullanılmasını da mükerrer sayar.
  Daha önce yayınlanmış bir görsel kuyrukta ve logda sarı uyarıyla işaretlenir (yayın engellenmez).

## Sunucu tarafı kuyruk motoru

Kuyruğu ilerleten döngü artık **tarayıcı sekmesinde değil, sunucuda** (`lib/queue-engine.ts`) çalışır; sekme
kapansa/uyusa kuyruk sürer. Arayüz yalnızca başlatır/durdurur ve 3–5 sn'de bir durumu yoklar.

- **Uçlar:** `POST /api/queue/run` (başlat / "giriş gerekli" duraklamasından devam), `POST /api/queue/stop`
  (mevcut ilan bittikten sonra durur), `GET /api/queue/status` (durum, güncel ilan, son adım logları).
  `/api/queue` artık öğe bazlıdır: `POST` ekler, `PATCH` tek ilanın alanlarını günceller, `DELETE` siler;
  tüm kuyruk bir daha toptan yazılmaz (telefon + masaüstü birbirinin değişikliğini ezmez).
- **Tek çalışma garantisi:** `queueruns` koleksiyonundaki tek belge Mongo lease'i işlevi görür
  (heartbeat 8 sn, 30 sn bayatlar). Aynı Mongo'yu iki makine paylaşsa bile yalnız biri yayın yapar.
- **Çökme kurtarma (`instrumentation.ts`):** sunucu açılışında `running` kalmış ilanlar yayın loguna bakılarak
  çözülür: loglu → `done`; son onay (adım-3) gönderilmiş/gönderilmek üzere → "kontrol edin" (hata, **asla
  otomatik yeniden yayınlanmaz**); diğeri → `pending`. Kuyruk kendiliğinden başlamaz.
- **Giriş kontrolü:** her yayın öncesi Sahibinden oturumu yoklanır; açık bir Sahibinden sekmesi giriş
  sayfasındaysa kuyruk `paused_login` olur ve Telegram'dan "Giriş gerekli" gider. Girişten sonra **Devam Et**.
- **Dikkat (test):** açılışta kurtarma, sunucunun bağlandığı `MONGODB_URI` veritabanına **yazar**. Geliştirme
  /test için `.env.local`'daki canlı veritabanını kullanma; `MONGODB_URI`'yi ayrı bir veritabanı adına çevir.

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
