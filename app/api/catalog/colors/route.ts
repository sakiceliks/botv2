import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { colorHexFor, colorNameExists, slugifyColorName } from "@/lib/catalog-types";
import { bumpMockImageVersion, readCatalog, writeCatalog } from "@/lib/catalog-store";

export const dynamic = "force-dynamic";

const MOCK_ROOT = path.join(process.cwd(), "mock-image");

/** mock-image altındaki renk klasörlerini (örn. "gumus") yeniden adlandırır. */
function renameColorFolders(oldName: string, newName: string): number {
  const from = slugifyColorName(oldName);
  const to = slugifyColorName(newName);
  if (!from || !to || from === to) return 0;

  let renamed = 0;
  let modelDirs: fs.Dirent[];
  try {
    modelDirs = fs.readdirSync(MOCK_ROOT, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const modelDir of modelDirs) {
    if (!modelDir.isDirectory() || modelDir.name.startsWith(".") || modelDir.name === "_source") continue;
    const modelPath = path.join(MOCK_ROOT, modelDir.name);
    const fromPath = path.join(modelPath, from);
    const toPath = path.join(modelPath, to);
    if (!fs.existsSync(fromPath)) continue;
    if (fs.existsSync(toPath)) {
      console.warn(`[CATALOG] ⚠️ ${modelDir.name}/${from} → ${to} atlanıyor (hedef zaten var)`);
      continue;
    }
    try {
      fs.renameSync(fromPath, toPath);
      renamed++;
    } catch (err) {
      console.warn(`[CATALOG] ⚠️ Klasör yeniden adlandırılamadı (${from}→${to}):`, err);
    }
  }
  if (renamed > 0) bumpMockImageVersion();
  return renamed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Renk adı zorunlu." }, { status: 400 });
    }

    const catalog = readCatalog();
    if (colorNameExists(catalog.colors, name)) {
      return NextResponse.json({ ok: false, error: "Bu renk palette zaten mevcut." }, { status: 409 });
    }

    const hex = typeof body?.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(body.hex.trim())
      ? body.hex.trim().toLowerCase()
      : colorHexFor(name);

    catalog.colors.push({ name, hex });
    catalog.colors.sort((a, b) => a.name.localeCompare(b.name, "tr"));

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
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Renk adı zorunlu." }, { status: 400 });
    }

    const catalog = readCatalog();
    const color = catalog.colors.find(
      (c) => c.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"),
    );
    if (!color) {
      return NextResponse.json({ ok: false, error: "Renk bulunamadı." }, { status: 404 });
    }

    const newName = typeof body?.newName === "string" && body.newName.trim() ? body.newName.trim() : null;
    let renamedFolders = 0;

    if (newName && newName !== color.name) {
      if (colorNameExists(catalog.colors, newName)) {
        return NextResponse.json({ ok: false, error: "Bu adla başka bir renk zaten var." }, { status: 409 });
      }
      const oldName = color.name;
      for (const brand of catalog.brands) {
        for (const model of brand.models) {
          model.colors = model.colors.map((c) =>
            c.toLocaleLowerCase("tr-TR") === oldName.toLocaleLowerCase("tr-TR") ? newName : c,
          );
        }
      }
      color.name = newName;
      renamedFolders = renameColorFolders(oldName, newName);
    }

    if (typeof body?.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(body.hex.trim())) {
      color.hex = body.hex.trim().toLowerCase();
    }

    catalog.colors.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    const updated = writeCatalog(catalog);
    return NextResponse.json({ ok: true, catalog: updated, renamedFolders });
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
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Renk adı zorunlu." }, { status: 400 });
    }

    const catalog = readCatalog();
    const before = catalog.colors.length;
    catalog.colors = catalog.colors.filter(
      (c) => c.name.toLocaleLowerCase("tr-TR") !== name.toLocaleLowerCase("tr-TR"),
    );
    if (catalog.colors.length === before) {
      return NextResponse.json({ ok: false, error: "Renk bulunamadı." }, { status: 404 });
    }

    for (const brand of catalog.brands) {
      for (const model of brand.models) {
        model.colors = model.colors.filter(
          (c) => c.toLocaleLowerCase("tr-TR") !== name.toLocaleLowerCase("tr-TR"),
        );
      }
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
