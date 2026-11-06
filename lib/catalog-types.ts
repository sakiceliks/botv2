// Paylaşılan katalog tipleri + şemalar (client & server güvenli, node:fs yok)
import { z } from "zod";

export type CatalogColor = { name: string; hex: string };

export type CatalogModel = {
  id: string;
  name: string;
  slug: string; // mock-image klasör adı (örn. "iphone-17-pro-max")
  active: boolean;
  colors: string[]; // modele özel renk adları (global paletten veya özel)
};

export type CatalogBrand = {
  id: string;
  name: string;
  slugPrefix: string; // mock görsel klasör önekİ (örn. "iphone")
  active: boolean;
  models: CatalogModel[];
};

export type Catalog = {
  version: 1;
  colors: CatalogColor[];
  brands: CatalogBrand[];
};

// ── Zod şemaları ─────────────────────────────────────────────────────────────

export const catalogColorSchema = z.object({
  name: z.string().trim().min(1).max(40),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir hex renk girin (örn. #11F08E)"),
});

export const catalogModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug yalnızca a-z, 0-9 ve '-' içerebilir"),
  active: z.boolean(),
  colors: z.array(z.string().trim().min(1).max(40)).max(60),
});

export const catalogBrandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  slugPrefix: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Önek yalnızca a-z, 0-9 ve '-' içerebilir"),
  active: z.boolean(),
  models: z.array(catalogModelSchema).max(500),
});

export const catalogSchema = z.object({
  version: z.literal(1),
  colors: z.array(catalogColorSchema).max(200),
  brands: z.array(catalogBrandSchema).max(100),
});

// ── Bilinen renk → hex eşlemesi (varsayılan palet) ───────────────────────────

export const DEFAULT_COLOR_HEX: Record<string, string> = {
  "Bej": "#d9c3a9",
  "Beyaz": "#f4f4f5",
  "Gri": "#9ca3af",
  "Siyah": "#27272a",
  "Bordo": "#7f1d1d",
  "Lacivert": "#1e3a8a",
  "Gümüş": "#c4c7cc",
  "Turuncu": "#f97316",
  "Mavi": "#2563eb",
  "Kırmızı": "#dc2626",
  "Yeşil": "#16a34a",
  "Mor": "#9333ea",
  "Sarı": "#eab308",
  "Pembe": "#ec4899",
};

/** Bilinmeyen renkler için adından deterministik hex üretir. */
export function fallbackColorHex(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return hslToHex(hue, 55, 52);
}

export function colorHexFor(name: string): string {
  return DEFAULT_COLOR_HEX[name] ?? fallbackColorHex(name);
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ── Yardımcılar ──────────────────────────────────────────────────────────────

/** Türkçe karakterleri koruyarak düşük harfli slug üretir (klasör adı için). */
export function slugifyColorName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Basit latinize slug (marka öneki vb. için). */
export function latinSlugify(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Marka öneki + model adından mock görsel klasör slug'ı (eski toModelSlug ile aynı). */
export function computeModelSlug(prefix: string, modelName: string): string {
  const p = prefix.toLocaleLowerCase("tr-TR");
  const name = modelName.toLocaleLowerCase("tr-TR").startsWith(`${p} `)
    ? modelName
    : `${prefix} ${modelName}`;
  return latinSlugify(name);
}

/** Ad benzersizliği için: aynı ad varsa "name-2", "name-3"... ekler. */
export function uniqueName(base: string, taken: string[]): string {
  const set = new Set(taken.map((t) => t.toLocaleLowerCase("tr-TR")));
  if (!set.has(base.toLocaleLowerCase("tr-TR"))) return base;
  let i = 2;
  while (set.has(`${base}-${i}`.toLocaleLowerCase("tr-TR"))) i++;
  return `${base}-${i}`;
}

/** Renk adı benzersizliği (tr-case-insensitive). */
export function colorNameExists(colors: CatalogColor[], name: string): boolean {
  return colors.some((c) => c.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"));
}
