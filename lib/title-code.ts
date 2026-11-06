// Client ve server'dan güvenle import edilebilir — node:fs bağımlılığı yok.
// Her ilan başlığının sonuna kısa bir kod eklenir (örn. "... 256 GB K7Q2").
// sahibinden aynı başlıklı ilanları mükerrer saydığı için başlıklar birbirinden farklı olmalı.

// Karışabilen karakterler (I/O/L, 0/1) ve Türkçe'de olmayan Q/W/X kullanılmaz
const CODE_LETTERS = "ABCDEFGHJKMNPRSTUVYZ";
const CODE_DIGITS = "23456789";

export const TITLE_CODE_RE = /\s[A-Z][2-9][A-Z][2-9]$/;

function pick(chars: string) {
  return chars[Math.floor(Math.random() * chars.length)];
}

export function randomTitleCode(): string {
  return pick(CODE_LETTERS) + pick(CODE_DIGITS) + pick(CODE_LETTERS) + pick(CODE_DIGITS);
}

export function stripTitleCode(title: string): string {
  return title.trim().replace(TITLE_CODE_RE, "").trim();
}

export function getTitleCode(title: string): string | null {
  const match = title.trim().match(TITLE_CODE_RE);
  return match ? match[0].trim() : null;
}

// Karşılaştırma anahtarı: büyük/küçük harf ve boşluk farkları aynı başlık sayılır
export function titleKey(title: string): string {
  return title.toLocaleUpperCase("tr-TR").replace(/\s+/g, " ").trim();
}

// Başlıktaki eski kodu atıp yeni bir kod ekler; `used` içindeki başlıklarla çakışmayan ilk sonucu döner
export function withTitleCode(title: string, used?: Set<string>): string {
  const base = stripTitleCode(title);
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = `${base} ${randomTitleCode()}`;
    if (!used || !used.has(titleKey(candidate))) {
      used?.add(titleKey(candidate));
      return candidate;
    }
  }
  throw new Error("Benzersiz başlık kodu üretilemedi.");
}

// sahibinden başlık sınırı aşılırsa kodu koruyarak gövdeyi kısaltır
export function fitTitleToLength(title: string, maxLength: number): string {
  if (!maxLength || title.length <= maxLength) return title;
  const code = getTitleCode(title);
  if (!code) return title.slice(0, maxLength).trim();
  const base = stripTitleCode(title).slice(0, maxLength - code.length - 1).trim();
  return `${base} ${code}`;
}
