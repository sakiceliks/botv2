// Sunucu tarafı katalog deposu — data/catalog.json (atomik yazım + seed)
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  catalogSchema,
  colorHexFor,
  computeModelSlug,
  latinSlugify,
  type Catalog,
  type CatalogBrand,
} from "./catalog-types";
import {
  BRANDS,
  BRAND_FOLDER_PREFIX,
  COLORS,
  MODEL_COLORS,
  toModelSlug,
} from "./manual-data";

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.json");
const MOCK_MANIFEST_PATH = path.join(process.cwd(), "mock-image", ".refresh.json");

/** İlk kurulumda data/catalog.json üretilir (mevcut sabit verilerden). */
export function buildDefaultCatalog(): Catalog {
  const paletteNames = [
    ...new Set([...COLORS, ...Object.values(MODEL_COLORS).flat()]),
  ];

  const brands: CatalogBrand[] = BRANDS.map((brand) => ({
    id: `b_${latinSlugify(brand.name).replace(/-/g, "") || randomUUID().slice(0, 8)}`,
    name: brand.name,
    slugPrefix: BRAND_FOLDER_PREFIX[brand.name] ?? latinSlugify(brand.name),
    active: true,
    models: brand.models.map((model) => ({
      id: `m_${randomUUID().slice(0, 12)}`,
      name: model,
      slug: toModelSlug(brand.name, model),
      active: true,
      colors: MODEL_COLORS[model] ?? [],
    })),
  }));

  return {
    version: 1,
    colors: paletteNames.map((name) => ({ name, hex: colorHexFor(name) })),
    brands,
  };
}

export function readCatalog(): Catalog {
  try {
    if (!fs.existsSync(CATALOG_PATH)) {
      const seeded = buildDefaultCatalog();
      writeCatalog(seeded);
      return seeded;
    }
    const raw = fs.readFileSync(CATALOG_PATH, "utf-8");
    const parsed = catalogSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error("[CATALOG] ⚠️ catalog.json doğrulanamadı, yedekler kullanılıyor:", parsed.error.issues.slice(0, 3));
      return buildDefaultCatalog();
    }
    return parsed.data as Catalog;
  } catch (err) {
    console.error("[CATALOG] ❌ Okuma hatası, varsayılan katalog dönülüyor:", err);
    return buildDefaultCatalog();
  }
}

export function writeCatalog(catalog: Catalog): Catalog {
  const parsed = catalogSchema.parse(catalog);
  fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
  const tmp = `${CATALOG_PATH}.${randomUUID().replace(/-/g, "").slice(0, 8)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2), "utf-8");
  fs.renameSync(tmp, CATALOG_PATH);
  return parsed as Catalog;
}

/** Görsel mutasyonlarından sonra tarayıcı cache'ini kırmak için manifest sürümünü artırır. */
export function bumpMockImageVersion(): void {
  try {
    let manifest: Record<string, unknown> = {};
    if (fs.existsSync(MOCK_MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MOCK_MANIFEST_PATH, "utf-8"));
    }
    const current = Number(manifest.version) || 0;
    manifest.version = Math.max(current, Date.now());
    manifest.generatedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(MOCK_MANIFEST_PATH), { recursive: true });
    fs.writeFileSync(MOCK_MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
  } catch (err) {
    console.warn("[CATALOG] ⚠️ Mock görsel cache bump başarısız:", err);
  }
}

export function newId(prefix: "b" | "m"): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function computeSlugFor(prefix: string, modelName: string): string {
  return computeModelSlug(prefix, modelName);
}
