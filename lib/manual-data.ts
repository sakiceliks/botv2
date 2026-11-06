// ── Slogan sistemi ───────────────────────────────────────────────────────────
// Havuz + şablon: markaya/model özgü sloganlar, genel sloganlar ve
// {BRAND}/{MODEL} placeholder'lı şablonlar birleştirilerek kullanılır.

export const GENERIC_SLOGANS = [
  "ALDIN ALDIN SIFIR KAPALI KUTU FIRSATI",
  "KISA SÜRELİ DEV KAMPANYA KAÇIRMA.!",
  "ÇİFT SİM SIFIR CİHAZLAR STOKTA",
  "SIFIR KAPALI KUTU HEMEN TESLİM",
  "BOL BOL AL TAKSİTLE RAHAT ÖDE",
  "STOKLAR TÜKENMEDEN YERİNİ AYIRT",
  "ORİJİNAL KAPALI KUTU GARANTİLİ",
  "SIFIR CİHAZ KILIF CAM HEDİYELİ",
  "ÇİFT SİM MODELLER SINIRLI STOK",
  "EN ÇOK SATAN MODELLER ŞİMDİ STOKTA",
  "FİYATLAR ARTMADAN HEMEN AL",
  "SATIŞ REKORLARI KIRAN MODELLER",
  "TELEFONUNU YENİLEMENİN TAM ZAMANI",
  "SIFIR ÇİFT SİM HAZIR TESLİM",
  "GARANTİLİ GÜVENLİ ALIŞVERİŞ",
  "ŞOK FİYAT ŞOK KAMPANYA.!",
  "KUTUSUNDA AÇILMAMIŞ SIFIR CİHAZLAR",
  "BÖYLE FİYAT GÖRÜLMEDİ HEMEN ARA.!",
  "EN İYİ FİYAT GARANTİSİYLE MAĞAZAMIZDA",
  "KREDİ KARTINA TAKSİT İMKANIYLA",
  "GLOBAL VERSİYON SIFIR KUTULU ÜRÜNLER",
  "VERİ TRANSFERİ VE KURULUM BİZDEN",
  "SINIRLI SAYIDA ÖZEL FİYAT KAÇIRMA.!",
  "TOPTAN FİYATINA PERAKENDE SATIŞ",
  "YÜKSEK HAFIZA SEÇENEKLERİ STOKTA",
  "EŞSİZ KAMERA DENEYİMİ İÇİN HEMEN AL",
  "UZMAN KADROMUZLA GÜVENİLİR HİZMET",
  "MAĞAZADA TEST ET GÖNÜL RAHATLIĞIYLA AL",
  "YILIN EN İYİ TELEFON KAMPANYASI",
  "PİYASANIN EN UYGUN RAKAMLARI BURADA",
  "HIZLI ŞARJ VE ÜSTÜN PERFORMANS",
  "VİTRİNİN YILDIZI MODELLER GELDİ",
  "GÜVENİN VE KALİTENİN TEK ADRESİ",
];

export const BRAND_SLOGANS: Record<string, string[]> = {
  Apple: [
    "APPLE SEVENLERE ÖZEL DEV FIRSAT",
    "İPHONE ALMANIN TAM ZAMANI.!",
    "TAKAS DESTEKLİ İPHONE FIRSATLARI",
    "İPHONE'DA EN ÇOK TERCİH EDİLENLER",
    "HEMEN TESLİM İPHONE MODELLERİ",
    "APPLE DÜNYASINA ŞİMDİ KATIL",
    "YENİ NESİL İPHONE MODELLERİ BURADA",
    "KAÇIRILMAYACAK İPHONE KAMPANYASI",
    "PREMİUM İPHONE DENEYİMİ SENİ BEKLİYOR",
    "BUGÜNE ÖZEL İPHONE İNDİRİMLERİ",
    "KAPALI KUTU APPLE CİHAZLAR",
    "İPHONE FIRSATLARI TÜKENMEDEN AL",
    "ADRESİNİZDE TAKAS HİZMETİ MEVCUT",
    "ESKİ CİHAZINI GETİR YENİSİNİ GÖTÜR",
    "TÜM RENK SEÇENEKLERİYLE STOKLARDA",
    "PRO VE MAX MODELLERİNDE ŞOK FİYAT",
    "HIZLI TESLİMAT GÜVENLİ ALIŞVERİŞ",
  ],
  Samsung: [
    "GALAXY DÜNYASINA ADIM AT",
    "GALAXY S SERİSİ ŞOK FİYATTA",
    "SAMSUNG'UN AMİRAL GEMİLERİ STOKTA",
    "GALAXY KAMERA DENEYİMİ İÇİN HEMEN AL",
    "SAMSUNG ÖZEL KAMPANYA KAÇIRMA.!",
    "GALAXY MODELLERİNDE DEV İNDİRİM",
    "SAMSUNG KAPALI KUTU GARANTİLİ",
  ],
  Xiaomi: [
    "XIAOMI'DAN DEVRİM FİYAT",
    "REDMI VE POCO FIRSATLARI STOKTA",
    "XIAOMI YÜKSEK PERFORMANS DÜŞÜK FİYAT",
    "AMİRAL GEMİSİ KAMPANYASI KAÇIRMA.!",
    "XIAOMI VE REDMI STOKLARDA",
    "POCO SERİSİ ŞİMDİ İNANILMAZ FİYATA",
  ],
};

export const MODEL_SLOGANS: Record<string, string[]> = {
  "17 Pro Max": [
    "17 PRO MAX STOKLARA GELDİ",
    "PRO MAX'İN EN UYGUN FİYATI",
  ],
  "17 Pro": [
    "17 PRO ŞİMDİ STOKTA",
    "PRO SERİSİNE GEÇİŞ ZAMANI",
  ],
  "16 Pro Max": [
    "16 PRO MAX'TE ŞOK FİYAT",
    "PRO MAX KAMPANYASI BAŞLADI",
  ],
  "Xiaomi 17 Pro Max": [
    "XIAOMI 17 PRO MAX FIRSATI",
    "17 PRO MAX DEVRİM FİYATTA",
  ],
  "Galaxy S25 Ultra": [
    "S25 ULTRA'YA ÖZEL FİYAT",
    "ULTRA KAMERA ULTRA FİYAT",
  ],
  "Galaxy S25": [
    "GALAXY S25 ŞİMDİ STOKTA",
    "S25 SERİSİNE ÖZEL İNDİRİM",
  ],
};

export const SLOGAN_TEMPLATES = [
  "{BRAND} {MODEL} FIRSATI",
  "{MODEL} SIFIR KAPALI KUTU",
  "{MODEL} HEMEN TESLİM",
  "{BRAND} {MODEL} STOKLARDA",
  "{MODEL} İÇİN EN İYİ FİYAT",
  "{MODEL} ALANA KILIF HEDİYE",
  "SADECE BUGÜNE {MODEL} FİYATI",
  "{BRAND} RESMİ GARANTİLİ {MODEL}",
  "{MODEL} ÇİFT SİM HAZIR TESLİM",
  "{MODEL} TAKASLA DA ALINIR",
];

export const LISTING_TITLE_MAX_LENGTH = 62;
const INSTALLMENT_TITLE_SUFFIX = "PEŞİN FİYATINA 6 TAKSİT";

function truncateTitlePart(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title;

  const cut = title.slice(0, maxLength).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

export function withInstallmentEmphasis(title: string): string {
  const normalizedTitle = title.toLocaleUpperCase("tr-TR");
  const bodyParts: string[] = [];
  let cursor = 0;
  let suffixIndex = normalizedTitle.indexOf(INSTALLMENT_TITLE_SUFFIX);
  while (suffixIndex !== -1) {
    bodyParts.push(title.slice(cursor, suffixIndex));
    cursor = suffixIndex + INSTALLMENT_TITLE_SUFFIX.length;
    suffixIndex = normalizedTitle.indexOf(INSTALLMENT_TITLE_SUFFIX, cursor);
  }
  bodyParts.push(title.slice(cursor));

  const body = bodyParts.join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const bodyLimit = LISTING_TITLE_MAX_LENGTH - INSTALLMENT_TITLE_SUFFIX.length - (body ? 1 : 0);
  const shortenedBody = truncateTitlePart(body, bodyLimit);
  return shortenedBody
    ? `${INSTALLMENT_TITLE_SUFFIX} ${shortenedBody}`
    : INSTALLMENT_TITLE_SUFFIX;
}

function fillTemplate(template: string, brand?: string, model?: string): string {
  return template
    .replace(/\{BRAND\}/g, brand ?? "")
    .replace(/\{MODEL\}/g, model ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSlogansFor(brand?: string, model?: string): string[] {
  const templates = SLOGAN_TEMPLATES.map((t) => fillTemplate(t, brand, model)).filter(Boolean);
  const pool = [
    ...(model ? MODEL_SLOGANS[model] ?? [] : []),
    ...(brand ? BRAND_SLOGANS[brand] ?? [] : []),
    ...GENERIC_SLOGANS,
    ...templates,
  ];

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const slogan of pool) {
    const key = slogan.toLocaleUpperCase("tr-TR");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(slogan);
  }
  return unique;
}

export function pickSlogan(pool: string[]): string {
  if (pool.length === 0) return GENERIC_SLOGANS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getUniqueSlogansForCount(
  pool: string[],
  count: number,
  preferred?: string,
): string[] {
  const normalizedPool = [...new Set((pool ?? []).map((s) => s.trim()).filter(Boolean))];
  const preferredKey = preferred?.trim();

  const orderedPool = preferredKey
    ? [preferredKey, ...normalizedPool.filter((s) => s.toLocaleUpperCase("tr-TR") !== preferredKey.toLocaleUpperCase("tr-TR"))]
    : normalizedPool;

  const basePool = orderedPool.length > 0 ? orderedPool : [GENERIC_SLOGANS[0]];
  const result: string[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const base = basePool[i % basePool.length] ?? GENERIC_SLOGANS[0];
    let slogan = base;
    let suffix = 1;

    while (used.has(slogan.toLocaleUpperCase("tr-TR"))) {
      slogan = `${base} ${suffix}`;
      suffix += 1;
    }

    used.add(slogan.toLocaleUpperCase("tr-TR"));
    result.push(slogan);
  }

  return result;
}

/** Başlığı birleştirip sahibinden karakter limitine (62) göre kırpar.
 * Xiaomi modellerinde depolama (GB) başlığa eklenmez, çünkü katalogda ayrı tutulur. */
export function buildListingTitle(
  ...parts: Array<string | undefined | null>
): string {
  const modelPart = parts[1] ?? "";
  const condition = parts[4] ?? "";
  const isXiaomi = /^xiaomi\s/i.test(modelPart);
  const filtered = parts.slice(0, 4).filter((p, i) => {
    if (!p) return false;
    if (isXiaomi && i === 2 && /\d+\s*GB/i.test(p)) return false;
    return true;
  });

  let joined = filtered
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedCondition = String(condition).toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
  const isSecondHand = normalizedCondition.includes("ikinci el");

  if (isSecondHand) {
    const removePhrases = [
      "sıfır kapalı kutu",
      "sifir kapali kutu",
      "kapalı kutu",
      "kapali kutu",
      "sıfır",
      "sifir",
      "kutusunda açılmamış",
      "kutusunda açilmamis",
      "sıfır kutulu",
      "sifir kutulu",
      "kapalı kutu fırsatı",
      "kapali kutu firsati",
    ];

    joined = joined.toLocaleLowerCase("tr-TR");
    for (const phrase of removePhrases) {
      joined = joined.split(phrase).join(" ");
    }
    joined = joined.replace(/\s+/g, " ").trim();

    joined = joined.startsWith("ikinci el") ? joined : `ikinci el ${joined}`.trim();
    joined = joined.toLocaleUpperCase("tr-TR");
  } else {
    joined = joined.toLocaleUpperCase("tr-TR");
  }

  return withInstallmentEmphasis(joined);
}

/** Mock görsel havuzunun klasör slug'ı (BulkAddModal + kuyruk görsel yenileme). */
export const BRAND_FOLDER_PREFIX: Record<string, string> = {
  Apple: "iphone",
  Samsung: "samsung",
  Xiaomi: "xiaomi",
};

export function toModelSlug(brand: string, model: string): string {
  const prefix = BRAND_FOLDER_PREFIX[brand] ?? brand.toLowerCase();
  // "Xiaomi 17 Pro Max" gibi marka adını zaten içeren modellerde prefix tekrar eklenmez
  const name = model.toLowerCase().startsWith(`${prefix} `) ? model : `${prefix} ${model}`;
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Geriye dönük uyumluluk (eski çağrı noktaları genel havuzu kullanır).
export const SLOGANS = GENERIC_SLOGANS;

export const BRANDS = [
  {
    name: "Apple",
    models: [
      "18 Pro Max",
      "18 Pro",
      "18",
      "Air",
      "Fold",
      "Duo",
      "17 Pro Max",
      "17 Pro",
      "17",
      "17e",
      "16 Pro Max",
      "16 Pro",
      "16 Plus",
      "16",
      "16e",
      "15 Pro Max",
      "15 Pro",
      "15 Plus",
      "15",
      "14 Pro Max",
      "14 Pro",
      "14 Plus",
      "14",
      "13 Pro Max",
      "13 Pro",
      "13",
      "13 mini",
    ],
  },
  {
    name: "Samsung",
    models: [
      "Galaxy S26 Ultra",
      "Galaxy S26+",
      "Galaxy S26",
      "Galaxy S25 Ultra",
      "Galaxy S25+",
      "Galaxy S25",
      "Galaxy S25 Edge",
      "Galaxy S25 FE",
      "Galaxy Z Fold 8",
      "Galaxy Z Flip 8",
      "Galaxy Z Fold 7",
      "Galaxy Z Flip 7",
      "Galaxy A57",
      "Galaxy A37",
      "Galaxy A56",
      "Galaxy A36",
    ],
  },
  {
    name: "Xiaomi",
    models: [
      "Xiaomi 17 Ultra",
      "Xiaomi 17 Pro Max",
      "Xiaomi 17 Pro",
      "Xiaomi 17",
      "Xiaomi 15T Pro",
      "Xiaomi 15T",
      "Xiaomi 15 Ultra",
      "Xiaomi 15",
      "Redmi Note 15 Pro+",
      "Redmi Note 15 Pro",
      "Redmi Note 15",
      "Redmi Note 14 Pro+",
      "Redmi Note 14 Pro",
      "Redmi 15C",
      "Poco F7 Pro",
      "Poco F7",
      "Poco X7 Pro",
    ],
  },
];

export const ANADOLU_TOWNS = [
  "Adalar",
  "Ataşehir",
  "Beykoz",
  "Çekmeköy",
  "Kadıköy",
  "Kartal",
  "Maltepe",
  "Pendik",
  "Sancaktepe",
  "Sultanbeyli",
  "Şile",
  "Tuzla",
  "Ümraniye",
  "Üsküdar",
];

// Şimdilik devre dışı: TOWNS'a eklenmediği sürece hiçbir ilan Avrupa yakasına yayınlanmaz.
export const AVRUPA_TOWNS = [
  "Arnavutköy",
  "Avcılar",
  "Bağcılar",
  "Bahçelievler",
  "Bakırköy",
  "Başakşehir",
  "Bayrampaşa",
  "Beşiktaş",
  "Beylikdüzü",
  "Beyoğlu",
  "Büyükçekmece",
  "Çatalca",
  "Esenler",
  "Esenyurt",
  "Eyüpsultan",
  "Fatih",
  "Gaziosmanpaşa",
  "Güngören",
  "Kağıthane",
  "Küçükçekmece",
  "Sarıyer",
  "Silivri",
  "Sultangazi",
  "Şişli",
  "Zeytinburnu",
];

// İlanların yayınlanabileceği aktif ilçeler. Avrupa'yı tekrar açmak için: [...ANADOLU_TOWNS, ...AVRUPA_TOWNS]
export const TOWNS = [...ANADOLU_TOWNS];

export const COLORS = [
  "Lacivert",
  "Gümüş",
  "Turuncu",
];

export const MODEL_COLORS: Record<string, string[]> = {
  "16 Pro Max": ["Bej", "Beyaz", "Gri", "Siyah"],
  "18 Pro Max": ["Siyah", "Gümüş", "Mavi", "Bordo"],
  "18 Pro": ["Siyah", "Gümüş", "Mavi", "Bordo"],
  "Xiaomi 17 Pro Max": ["Siyah", "Beyaz", "Mor", "Yeşil"],
  "Xiaomi 17 Pro": ["Siyah", "Beyaz", "Mor", "Yeşil"],
  "Duo": ["Beyaz", "Lacivert"],
};

export function getColorsForModel(model?: string): string[] {
  return (model ? MODEL_COLORS[model] : undefined) ?? COLORS;
}

export const STORAGE_CAPACITIES = [
  "128 GB",
  "256 GB",
  "512 GB",
  "1 TB",
];

/** Modellerin kendi (taban) depolama kapasitesi. Eksik modellerde DEFAULT_STORAGE kullanılır. */
export const MODEL_STORAGE: Record<string, string> = {
  "18 Pro Max": "256 GB",
  "18 Pro": "256 GB",
  "18": "256 GB",
  "Air": "256 GB",
  "Fold": "256 GB",
  "17 Pro Max": "256 GB",
  "17 Pro": "256 GB",
  "17": "256 GB",
  "17e": "128 GB",
  "16 Pro Max": "128 GB",
  "16 Pro": "128 GB",
  "16 Plus": "128 GB",
  "16": "128 GB",
  "16e": "128 GB",
  "15 Pro Max": "256 GB",
  "15 Pro": "128 GB",
  "15 Plus": "128 GB",
  "15": "128 GB",
  "14 Pro Max": "128 GB",
  "14 Pro": "128 GB",
  "14 Plus": "128 GB",
  "14": "128 GB",
  "13 Pro Max": "128 GB",
  "13 Pro": "128 GB",
  "13": "128 GB",
  "13 mini": "128 GB",

  "Galaxy S26 Ultra": "256 GB",
  "Galaxy S26+": "256 GB",
  "Galaxy S26": "256 GB",
  "Galaxy S25 Ultra": "256 GB",
  "Galaxy S25+": "256 GB",
  "Galaxy S25 Edge": "256 GB",
  "Galaxy S25": "128 GB",
  "Galaxy S25 FE": "128 GB",
  "Galaxy Z Fold 8": "256 GB",
  "Galaxy Z Flip 8": "256 GB",
  "Galaxy Z Fold 7": "256 GB",
  "Galaxy Z Flip 7": "256 GB",
  "Galaxy A57": "128 GB",
  "Galaxy A37": "128 GB",
  "Galaxy A56": "128 GB",
  "Galaxy A36": "128 GB",

  "Xiaomi 17 Ultra": "512 GB",
  "Xiaomi 17 Pro Max": "512 GB",
  "Xiaomi 17 Pro": "512 GB",
  "Xiaomi 17": "512 GB",
  "Xiaomi 15T Pro": "256 GB",
  "Xiaomi 15T": "256 GB",
  "Xiaomi 15 Ultra": "512 GB",
  "Xiaomi 15": "256 GB",
  "Redmi Note 15 Pro+": "256 GB",
  "Redmi Note 15 Pro": "256 GB",
  "Redmi Note 15": "128 GB",
  "Redmi Note 14 Pro+": "256 GB",
  "Redmi Note 14 Pro": "256 GB",
  "Redmi 15C": "128 GB",
  "Poco F7 Pro": "256 GB",
  "Poco F7": "256 GB",
  "Poco X7 Pro": "256 GB",
};

export const DEFAULT_STORAGE = "256 GB";

export function getStorageForModel(model?: string): string {
  return (model ? MODEL_STORAGE[model] : undefined) ?? DEFAULT_STORAGE;
}

export const DEFAULT_DESCRIPTION = `Bizde yok: Kandırmaca, şişirme fiyat
Bizde var: Dürüst alışveriş, samimi sohbet, bol bol espri


“Telefon eskiyse dert etme, bizde yenisi cepte!”

Sıfır var ✔️
İkinci el var ✔️
Kasa çatlamış, ekran patlamış, o da bizde çözülür

“Abi telefon ne kadar?” diye soranlara güzel fiyatlar,
“Eskiyi ver, yeniyi al” diyenlere capcanlı cihazlar burada!

Ne satıyoruz?
Sıfır kutusunda telefonlar
♻️ Temiz, garantili 2. el cihazlar
Takas olur, nakit olur, çay da olur ☕

Telefon sende dert olmasın, biz buradayız

– Ekranı Kırık Gönüllere Dokunuyoruz.`;
