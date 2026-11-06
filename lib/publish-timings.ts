// Publish akışındaki tüm bekleme eşikleri tek yerde toplanır.
// Hız problemi yaşarsan (sahibinden bot tespiti / yarım kalan form)
// yalnızca bu dosyadaki değerleri büyüterek akışı yavaşlatabilirsin.

export const PUBLISH_TIMINGS = {
  // Tarayıcıya bağlanma (askıda kalma riskine karşı kısa timeout)
  connectTimeoutMs: 1_500,

  // Sayfa açılışı / redirect
  initialRedirectTimeoutMs: 4_000,
  domSettleTimeoutMs: 4_000,

  // Taslak devam modalı
  draftModalRaceMs: 6_000, // modal ya da yükleme input'u hazır olana kadar (erken çıkışlı)
  draftModalPollMs: 150,
  draftModalCloseTimeoutMs: 3_000,
  draftModalRecheckTimeoutMs: 2_000, // "hala görünüyor mu?" toplam penceresi
  draftModalLatePollMs: 2_500,   // girişte modal geç belirirse yakalama penceresi

  // Dosya yükleme
  uploadPollMs: 150,
  uploadTimeoutMs: 10_000,
  uploadFallbackTimeoutMs: 8_000,

  // Fotoğraf yükleme bitişi: thumbnail sayımı + yükleme göstergesi + stabilite
  photoReadyTimeoutMs: 15_000,   // genel faz bekleme üst sınırı
  photoStableMs: 800,            // thumbnail sayısının sabit kalması gereken süre
  photoStablePollMs: 200,        // poll aralığı
  photoContinueDelayMs: 2_000,   // görsel yüklendikten sonra "Devam Et" öncesi bekleme

  // "Devam" navigasyon retry (tıklama sonrası URL değişmediyse tekrar)
  continueRetryCount: 3,
  continueRetryDelayMs: 700,
  continueReadyTimeoutMs: 5_000, // butonun hazır (enabled) olmasını bekleme

  // Genel kısa bekleme (minimum)
  minSettleMs: 120,
  selectSettleMs: 80,
  modelOptionsTimeoutMs: 3_000, // marka seçilince model seçenekleri yüklenene kadar

  // Modal/uyarı kontrolü toleransları (sadece gerçekten tetiklendikten sonra)
  usageLimitAppearMs: 400,
  dopingAppearMs: 600,

  // Navigasyon bekleme (waitForNavigation yerine URL değişim takibi)
  navStepTimeoutMs: 15_000,
  navFormTimeoutMs: 20_000,
  navSubmitTimeoutMs: 25_000,
  categoryNavTimeoutMs: 12_000,
  previewLeaveTimeoutMs: 15_000,

  // Buton enabled kontrolü
  buttonReadyTimeoutMs: 8_000,
  previewContinueReadyTimeoutMs: 1_200, // adim-3 "Devam Et" butonu spesifik bekleme
  previewContinueDelayMs: 2_000,        // adim-3 ekranında loader kilitlenmemesi için tıklama öncesi bekleme
  loaderTimeoutMs: 4_000, // sayfa loader/overlay temizliği

  // Ürün özellikleri: select opsiyonlarının asenkron dolması
  productSelectsTimeoutMs: 10_000,

  // Kategori etiketi arama (bulunamazsa hata üretme penceresi)
  categoryLabelTimeoutMs: 8_000,
  sicilyVisibleTimeoutMs: 1_500, // "Devam Et" gizli elementinin görünür olması

  // URL tabanlı döngü (adim-3 / doping / tebrikler)
  urlLoopPollMs: 150,
  loopStepTimeoutMs: 1_200, // döngü adımları arasında URL değişimi bekleme penceresi
} as const;

export type PublishTimings = typeof PUBLISH_TIMINGS;
