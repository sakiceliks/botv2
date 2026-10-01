export const SLOGANS = [
  // Mevcut Sloganlar
  "ALDIN ALDIN SIFIR KAPALI KUTU FIRSATI",
  "KISA SÜRELİ DEV KAMPANYA KAÇIRMA.!",
  "ÇİFT SİM SIFIR CİHAZLAR STOKTA",
  "APPLE SEVENLERE ÖZEL DEV FIRSAT",
  "İPHONE ALMANIN TAM ZAMANI.!",
  "SIFIR KAPALI KUTU HEMEN TESLİM",
  "TAKAS DESTEKLİ İPHONE FIRSATLARI",
  "BOL BOL AL TAKSİTLE RAHAT ÖDE",
  "STOKLAR TÜKENMEDEN YERİNİ AYIRT",
  "İPHONE'DA EN ÇOK TERCİH EDİLENLER",
  "ORİJİNAL KAPALI KUTU GARANTİLİ",
  "SIFIR CİHAZ KILIF CAM HEDİYELİ",
  "ÇİFT SİM MODELLER SINIRLI STOK",
  "HEMEN TESLİM İPHONE MODELLERİ",
  "APPLE DÜNYASINA ŞİMDİ KATIL",
  "YENİ NESİL İPHONE MODELLERİ BURADA",
  "ADRESİNİZDE TAKAS HİZMETİ MEVCUT",
  "EN ÇOK SATAN MODELLER ŞİMDİ STOKTA",
  "FİYATLAR ARTMADAN HEMEN AL",
  "KAÇIRILMAYACAK İPHONE KAMPANYASI",
  "SATIŞ REKORLARI KIRAN MODELLER",
  "TELEFONUNU YENİLEMENİN TAM ZAMANI",
  "SIFIR ÇİFT SİM HAZIR TESLİM",
  "GARANTİLİ GÜVENLİ ALIŞVERİŞ",
  "PREMİUM İPHONE DENEYİMİ SENİ BEKLİYOR",
  "ŞOK FİYAT ŞOK KAMPANYA.!",
  "BUGÜNE ÖZEL İPHONE İNDİRİMLERİ",
  "KAPALI KUTU APPLE CİHAZLAR",
  "İPHONE FIRSATLARI TÜKENMEDEN AL",
  "HIZLI TESLİMAT GÜVENLİ ALIŞVERİŞ",
  "ESKİ CİHAZINI GETİR YENİSİNİ GÖTÜR",
  "TÜM RENK SEÇENEKLERİYLE STOKLARDA",
  "KUTUSUNDA AÇILMAMIŞ SIFIR CİHAZLAR",
  "BÖYLE FİYAT GÖRÜLMEDİ HEMEN ARA.!",
  "PRO VE MAX MODELLERİNDE ŞOK FİYAT",
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
  "GÜVENİN VE KALİTENİN TEK ADRESİ"
];
export const BRANDS = [
  {
    name: "Apple",
    models: [
      "18 Pro Max",
      "18 Pro",
      "17 Pro Max",
      "17 Pro",
      "17",
      "16 Pro Max",
      "16 Pro",
      "16",
      "15 Pro Max",
      "15 Pro",
      "15 Plus",
      "15",
      "14 Pro Max",
      "14 Pro",
      "13 Pro Max",
      "13",
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
      "Galaxy Z Fold 7",
      "Galaxy Z Flip 7",
    ],
  },
  {
    name: "Xiaomi",
    models: [
      "17 Pro Max",
      "17 Pro",
    ],
  },
];

export const TOWNS = [
  "Adalar",
  "Arnavutköy",
  "Ataşehir",
  "Avcılar",
  "Bağcılar",
  "Bahçelievler",
  "Bakırköy",
  "Başakşehir",
  "Bayrampaşa",
  "Beşiktaş",
  "Beykoz",
  "Beylikdüzü",
  "Beyoğlu",
  "Büyükçekmece",
  "Çatalca",
  "Çekmeköy",
  "Esenler",
  "Enyurt",
  "Eyüpsultan",
  "Fatih",
  "Gaziosmanpaşa",
  "Güngören",
  "Kadıköy",
  "Kağıthane",
  "Kartal",
  "Küçükçekmece",
  "Maltepe",
  "Pendik",
  "Sancaktepe",
  "Sarıyer",
  "Silivri",
  "Sultanbeyli",
  "Sultangazi",
  "Şile",
  "Şişli",
  "Tuzla",
  "Ümraniye",
  "Üsküdar",
  "Zeytinburnu",
];

export const COLORS = [
  "Lacivert",
  "Gümüş",
  "Turuncu",
];

// Anahtar: "Marka__Model" (modelPriceRanges ile aynı). Her renk, mock-image/<model>/<renk-slug>/ klasörüne karşılık gelir.
export const MODEL_COLORS: Record<string, string[]> = {
  "Apple__18 Pro Max": ["Siyah", "Gümüş", "Mavi", "Bordo"],
  "Apple__18 Pro": ["Siyah", "Gümüş", "Mavi", "Bordo"],
  "Apple__17 Pro Max": ["Gümüş", "Lacivert", "Turuncu"],
  "Apple__17 Pro": ["Gümüş", "Lacivert", "Turuncu"],
  "Apple__16 Pro Max": ["Bej", "Beyaz", "Gri", "Siyah"],
  "Xiaomi__17 Pro Max": ["Siyah", "Beyaz", "Mor", "Yeşil"],
  "Xiaomi__17 Pro": ["Siyah", "Beyaz", "Mor", "Yeşil"],
};

export function getColorsForModel(brand?: string, model?: string): string[] {
  return (brand && model ? MODEL_COLORS[`${brand}__${model}`] : undefined) ?? COLORS;
}

// Apple dışı markalarda iPhone/Apple geçen sloganlar kullanılmaz
export function getSlogansForBrand(brand?: string): string[] {
  if (brand === "Apple") return SLOGANS;
  return SLOGANS.filter((slogan) => !/İPHONE|APPLE/.test(slogan));
}

export const STORAGE_CAPACITIES = [
  "128 GB",
  "256 GB",
  "512 GB",
  "1 TB",
];

export const DEFAULT_DESCRIPTION = `Ürün sıfır kapalı kutu. 1 Yıl Apple Garantili

Detayli bilgi için arayınız `;

const GENERIC_DESCRIPTION = `Ürün sıfır kapalı kutu.

Detayli bilgi için arayınız `;

export function getDefaultDescription(brand?: string): string {
  return brand === "Apple" ? DEFAULT_DESCRIPTION : GENERIC_DESCRIPTION;
}
