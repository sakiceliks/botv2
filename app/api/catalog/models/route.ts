import { NextResponse } from "next/server";
import { computeModelSlug } from "@/lib/catalog-types";
import { newId, readCatalog, writeCatalog } from "@/lib/catalog-store";
import { readSettings, writeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Model adı değişince bot-settings modelPriceRanges anahtarlarını da taşır. */
function migratePriceRangeKey(brandName: string, oldModel: string, newModel: string) {
  try {
    const settings = readSettings();
    const ranges = { ...(settings.modelPriceRanges ?? {}) };
    const oldKey = `${brandName}__${oldModel}`;
    if (ranges[oldKey]) {
      ranges[`${brandName}__${newModel}`] = ranges[oldKey];
      delete ranges[oldKey];
      writeSettings({ modelPriceRanges: ranges });
    }
  } catch (err) {
    console.warn("[CATALOG] ⚠️ Fiyat aralığı anahtar taşınamadı:", err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brandId = String(body?.brandId ?? "");
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Model adı zorunlu." }, { status: 400 });
    }

    const catalog = readCatalog();
    const brand = catalog.brands.find((b) => b.id === brandId);
    if (!brand) {
      return NextResponse.json({ ok: false, error: "Marka bulunamadı." }, { status: 404 });
    }
    if (brand.models.some((m) => m.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"))) {
      return NextResponse.json({ ok: false, error: "Bu model marka altında zaten mevcut." }, { status: 409 });
    }

    const slug = computeModelSlug(brand.slugPrefix, name);
    brand.models.push({
      id: newId("m"),
      name,
      slug,
      active: true,
      colors: Array.isArray(body?.colors) ? body.colors.map(String).slice(0, 60) : [],
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
    let modelRef: { model: (typeof catalog.brands)[number]["models"][number]; brand: (typeof catalog.brands)[number] } | null = null;
    for (const brand of catalog.brands) {
      const model = brand.models.find((m) => m.id === id);
      if (model) {
        modelRef = { model, brand };
        break;
      }
    }
    if (!modelRef) {
      return NextResponse.json({ ok: false, error: "Model bulunamadı." }, { status: 404 });
    }
    const { model, brand } = modelRef;

    // Modeli başka markaya taşı
    if (typeof body?.brandId === "string" && body.brandId !== brand.id) {
      const target = catalog.brands.find((b) => b.id === body.brandId);
      if (!target) {
        return NextResponse.json({ ok: false, error: "Hedef marka bulunamadı." }, { status: 404 });
      }
      if (target.models.some((m) => m.name.toLocaleLowerCase("tr-TR") === model.name.toLocaleLowerCase("tr-TR"))) {
        return NextResponse.json(
          { ok: false, error: "Hedef markada aynı ada sahip model var." },
          { status: 409 },
        );
      }
      brand.models = brand.models.filter((m) => m.id !== id);
      model.slug = computeModelSlug(target.slugPrefix, model.name);
      target.models.push(model);
      migratePriceRangeKey(brand.name, model.name, model.name); // eski marka altından düşer
    }

    if (typeof body?.name === "string" && body.name.trim()) {
      const newName = body.name.trim();
      if (newName !== model.name) {
        // slug bilinçli olarak korunur — görsel klasörü orphan olmasın
        migratePriceRangeKey(
          catalog.brands.find((b) => b.models.some((m) => m.id === id))?.name ?? brand.name,
          model.name,
          newName,
        );
        model.name = newName;
      }
    }

    if (typeof body?.slug === "string" && body.slug.trim()) {
      const slug = body.slug.trim().toLowerCase();
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
        return NextResponse.json(
          { ok: false, error: "Slug yalnızca a-z, 0-9 ve '-' içerebilir." },
          { status: 400 },
        );
      }
      model.slug = slug;
    }

    if (body?.regenerateSlug === true) {
      const currentBrand = catalog.brands.find((b) => b.models.some((m) => m.id === id)) ?? brand;
      model.slug = computeModelSlug(currentBrand.slugPrefix, model.name);
    }

    if (typeof body?.active === "boolean") {
      model.active = body.active;
    }

    if (Array.isArray(body?.colors)) {
      model.colors = body.colors.map((c: unknown) => String(c).trim()).filter(Boolean).slice(0, 60);
    }

    if (typeof body?.order === "number") {
      const currentBrand = catalog.brands.find((b) => b.models.some((m) => m.id === id)) ?? brand;
      const from = currentBrand.models.findIndex((m) => m.id === id);
      const to = Math.max(0, Math.min(currentBrand.models.length - 1, body.order));
      if (from !== to) {
        currentBrand.models.splice(to, 0, ...currentBrand.models.splice(from, 1));
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

    const catalog = readCatalog();
    let removed = false;
    for (const brand of catalog.brands) {
      const before = brand.models.length;
      brand.models = brand.models.filter((m) => m.id !== id);
      if (brand.models.length !== before) {
        removed = true;
        break;
      }
    }
    if (!removed) {
      return NextResponse.json({ ok: false, error: "Model bulunamadı." }, { status: 404 });
    }

    const updated = writeCatalog(catalog);
    return NextResponse.json({ ok: true, catalog: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Silme hatası" },
      { status: 500 },
    );
  }
}
