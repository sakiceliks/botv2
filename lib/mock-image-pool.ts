// Sunucu tarafı mock görsel havuzu: listeleme, model slug'ı ve havuzdan uploads/ klasörüne kopyalama.
// Hem /api/mock-images uçları hem kuyruk motoru (görsel yeniden bağlama) hem de toplu ekleme kullanır;
// böylece görseller telefona indirilip geri yüklenmez.
import { copyFile, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { readCatalog } from "@/lib/catalog-store";
import { computeModelSlug, slugifyColorName } from "@/lib/catalog-types";
import { toModelSlug as legacyToModelSlug } from "@/lib/manual-data";

export const MOCK_IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp)$/i;

export function getMockImageDir() {
  return path.join(process.cwd(), "mock-image");
}

export type MockPoolImage = {
  filename: string;
  /** mock-image/ köküne göre yol parçaları, örn. ["iphone-17-pro", "gumus", "x.jpg"] */
  segments: string[];
  color?: string;
};

// Havuz yenilendiğinde tarayıcı cache'ini kırmak için URL'lere ?v= eklenir.
export async function cacheVersion(): Promise<string> {
  try {
    const raw = await readFile(path.join(getMockImageDir(), ".refresh.json"), "utf8");
    const version = JSON.parse(raw)?.version;
    if (version != null) return `?v=${encodeURIComponent(String(version))}`;
  } catch {
    /* manifest yok → ?v= eklenmez */
  }
  return "";
}

// Renk klasör adı (ör. "gumus") → palet renk adı (ör. "Gümüş"). Her çağrıda katalogdan taze okunur;
// böylece panele eklenen yeni renkler anında eşleşir.
export function buildKnownColorSlugs(): Record<string, string> {
  const map: Record<string, string> = {};
  try {
    const catalog = readCatalog();
    for (const color of catalog.colors) {
      map[slugifyColorName(color.name)] = color.name;
    }
    // Model bazlı renkler de palette olmayabilir
    for (const brand of catalog.brands) {
      for (const model of brand.models) {
        for (const color of model.colors) {
          const slug = slugifyColorName(color);
          if (!map[slug]) map[slug] = color;
        }
      }
    }
  } catch {
    /* katalog yoksa boş map */
  }
  return map;
}

/** Model klasöründeki görseller (doğrudan dosyalar + renk alt klasörleri). Klasör yoksa fırlatır. */
export async function listModelPool(modelSlug: string): Promise<MockPoolImage[]> {
  if (!/^[a-z0-9-]+$/.test(modelSlug)) return [];
  const modelDir = path.join(getMockImageDir(), modelSlug);
  const knownColorSlugs = buildKnownColorSlugs();
  const entries = await readdir(modelDir, { withFileTypes: true });
  const images: MockPoolImage[] = [];

  for (const entry of entries) {
    if (entry.isFile() && MOCK_IMAGE_EXT_RE.test(entry.name)) {
      images.push({ filename: entry.name, segments: [modelSlug, entry.name] });
    } else if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "_source") continue;

      const colorName = knownColorSlugs[entry.name.toLowerCase()];
      const colorEntries = await readdir(path.join(modelDir, entry.name), { withFileTypes: true }).catch(() => []);
      for (const colorEntry of colorEntries) {
        if (colorEntry.isFile() && MOCK_IMAGE_EXT_RE.test(colorEntry.name)) {
          images.push({
            filename: colorEntry.name,
            segments: [modelSlug, entry.name, colorEntry.name],
            ...(colorName ? { color: colorName } : {}),
          });
        }
      }
    }
  }

  return images;
}

/** Havuz kökündeki (model klasörü olmayan) görseller. */
export async function listRootPool(): Promise<MockPoolImage[]> {
  const files = await readdir(getMockImageDir());
  return files
    .filter((f) => MOCK_IMAGE_EXT_RE.test(f))
    .map((f) => ({ filename: f, segments: [f] }));
}

/** Model havuzu; klasör yoksa ya da boşsa kök havuzuna düşer (eski /api/mock-images davranışı). */
export async function listPoolForModel(modelSlug: string | null): Promise<MockPoolImage[]> {
  if (modelSlug && /^[a-z0-9-]+$/.test(modelSlug)) {
    try {
      const images = await listModelPool(modelSlug);
      if (images.length > 0) return images;
    } catch {
      /* model klasörü yok, kökten devam */
    }
  }
  return listRootPool();
}

/** İstemcideki useCatalog().toModelSlug ile aynı kural: önce katalog, yoksa eski sabit mantık. */
export function resolveModelSlug(brand: string, model: string): string {
  try {
    const catalog = readCatalog();
    const lowerBrand = brand.toLocaleLowerCase("tr-TR");
    const brandEntry = catalog.brands.find((b) => b.name.toLocaleLowerCase("tr-TR") === lowerBrand);
    if (brandEntry) {
      const lowerModel = model.toLocaleLowerCase("tr-TR");
      const modelEntry = brandEntry.models.find((m) => m.name.toLocaleLowerCase("tr-TR") === lowerModel);
      if (modelEntry) return modelEntry.slug;
      return computeModelSlug(brandEntry.slugPrefix, model);
    }
  } catch {
    /* katalog okunamazsa eski mantık */
  }
  return legacyToModelSlug(brand, model);
}

// ── Havuzdan uploads/ klasörüne kopyalama ────────────────────────────────────────────────────
const UPLOAD_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

/**
 * `mock-image/` altındaki bir görseli `uploads/` altına kopyalar ve /api/upload ile aynı biçimde
 * `{ imageUrl, imagePath }` döner. Yol parçaları 1–3 adet olmalı; dizin geçişi ve dışarı çıkış reddedilir.
 */
export async function copyMockImageToUploads(segments: string[]): Promise<{ imageUrl: string; imagePath: string }> {
  if (!Array.isArray(segments) || segments.length === 0 || segments.length > 3) {
    throw new Error("Geçersiz görsel yolu.");
  }
  for (const segment of segments) {
    if (!segment || segment === "." || segment.includes("..") || /[\\/\0]/.test(segment)) {
      throw new Error("Geçersiz görsel yolu.");
    }
  }
  const filename = segments[segments.length - 1];
  const ext = path.extname(filename).toLowerCase();
  if (!UPLOAD_EXTS.has(ext)) throw new Error(`Desteklenmeyen dosya uzantısı: ${ext || "(yok)"}`);

  const baseDir = getMockImageDir();
  const source = path.resolve(baseDir, ...segments);
  if (!source.startsWith(baseDir + path.sep)) throw new Error("Geçersiz görsel yolu.");
  const info = await stat(source).catch(() => null);
  if (!info?.isFile()) throw new Error("Mock görsel bulunamadı.");

  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${safeName}`;
  await copyFile(source, path.join(uploadDir, fileName));
  return { imageUrl: `/uploads/${fileName}`, imagePath: `/uploads/${fileName}` };
}

/** `/api/mock-images/a/b/c.jpg?v=1` biçimindeki URL'den yol parçalarını çıkarır. */
export function segmentsFromMockImageUrl(url: string): string[] | null {
  let pathname: string;
  try {
    pathname = new URL(url, "http://localhost").pathname;
  } catch {
    return null;
  }
  const prefix = "/api/mock-images/";
  if (!pathname.startsWith(prefix)) return null;
  try {
    return pathname
      .slice(prefix.length)
      .split("/")
      .filter(Boolean)
      .map((s) => decodeURIComponent(s));
  } catch {
    return null;
  }
}
