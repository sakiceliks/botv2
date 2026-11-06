import { NextResponse } from "next/server";
import { latinSlugify } from "@/lib/catalog-types";
import { newId, readCatalog, writeCatalog } from "@/lib/catalog-store";
import { readSettings, writeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Marka/model adı değişince bot-settings modelPriceRanges anahtarlarını da taşır. */
function migratePriceRangeKeys(mutate: (ranges: Record<string, { min: number; max: number }>) => void) {
  try {
    const settings = readSettings();
    const ranges = { ...(settings.modelPriceRanges ?? {}) };
    const before = JSON.stringify(ranges);
    mutate(ranges);
    if (JSON.stringify(ranges) !== before) {
      writeSettings({ modelPriceRanges: ranges });
    }
  } catch (err) {
    console.warn("[CATALOG] ⚠️ Fiyat aralığı anahtar taşınamadı:", err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Marka adı zorunlu." }, { status: 400 });
    }

    const catalog = readCatalog();
    if (
      catalog.brands.some((b) => b.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"))
    ) {
      return NextResponse.json({ ok: false, error: "Bu marka zaten mevcut." }, { status: 409 });
    }

    const prefixRaw = String(body?.slugPrefix ?? "").trim() || latinSlugify(name);
    const slugPrefix = latinSlugify(prefixRaw);
    if (!slugPrefix) {
      return NextResponse.json({ ok: false, error: "Geçerli bir klasör öneki üretilemedi." }, { status: 400 });
    }

    catalog.brands.push({
      id: newId("b"),
      name,
      slugPrefix,
      active: true,
      models: [],
    });

    const updated = writeCatalog(catalog);
    return NextResponse.json({ ok: true, catalog: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Ekleme hatası" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id ?? "");
    const catalog = readCatalog();
    const brand = catalog.brands.find((b) => b.id === id);
    if (!brand) {
      return NextResponse.json({ ok: false, error: "Marka bulunamadı." }, { status: 404 });
    }

    if (typeof body?.name === "string" && body.name.trim()) {
      const newName = body.name.trim();
      if (newName !== brand.name) {
        const oldName = brand.name;
        migratePriceRangeKeys((ranges) => {
          for (const key of Object.keys(ranges)) {
            if (key.startsWith(`${oldName}__`)) {
              ranges[`${newName}__${key.slice(oldName.length + 2)}`] = ranges[key];
              delete ranges[key];
            }
          }
        });
        brand.name = newName;
      }
    }

    if (typeof body?.slugPrefix === "string" && body.slugPrefix.trim()) {
      brand.slugPrefix = latinSlugify(body.slugPrefix.trim());
    }

    if (typeof body?.active === "boolean") {
      brand.active = body.active;
    }

    if (typeof body?.order === "number") {
      const from = catalog.brands.findIndex((b) => b.id === id);
      const to = Math.max(0, Math.min(catalog.brands.length - 1, body.order));
      if (from !== to) {
        catalog.brands.splice(to, 0, ...catalog.brands.splice(from, 1));
      }
    }

    const updated = writeCatalog(catalog);
    return NextResponse.json({ ok: true, catalog: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Güncelleme hatası" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id ?? "");
    const force = Boolean(body?.force);

    const catalog = readCatalog();
    const brand = catalog.brands.find((b) => b.id === id);
    if (!brand) {
      return NextResponse.json({ ok: false, error: "Marka bulunamadı." }, { status: 404 });
    }

    if (brand.models.length > 0 && !force) {
      return NextResponse.json(
        { ok: false, error: "has_models", modelCount: brand.models.length },
        { status: 409 },
      );
    }

    catalog.brands = catalog.brands.filter((b) => b.id !== id);
    const updated = writeCatalog(catalog);
    return NextResponse.json({ ok: true, catalog: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Silme hatası" },
      { status: 500 },
    );
  }
}
