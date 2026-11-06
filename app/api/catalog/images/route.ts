import { mkdir, readdir, rename as fsRename, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { slugifyColorName, type Catalog } from "@/lib/catalog-types";
import { bumpMockImageVersion, readCatalog } from "@/lib/catalog-store";

export const dynamic = "force-dynamic";

const MOCK_ROOT = path.join(process.cwd(), "mock-image");
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp)$/i;
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_FILES_PER_REQUEST = 40;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type ImageEntry = {
  filename: string;
  url: string;
  color?: string;
  colorSlug?: string;
  size: number;
  modifiedAt: number;
};

function contentTypeFor(ext: string): string {
  const e = ext.toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".gif") return "image/gif";
  if (e === ".webp") return "image/webp";
  return "image/jpeg";
}

/** slug → palet renk adı (varsa); bilinmeyen slug'lar için slug'ın kendisi. */
function colorNameForSlug(catalog: Catalog, colorSlug: string): string {
  const match = catalog.colors.find((c) => slugifyColorName(c.name) === colorSlug);
  return match?.name ?? colorSlug;
}

function safeFilename(raw: string): string {
  const base = raw.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^[.-]+/, "").slice(0, 120);
  return base || `image-${Date.now()}.jpg`;
}

async function uniqueFilename(dir: string, filename: string): Promise<string> {
  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);
  let candidate = filename;
  let i = 2;
  while (true) {
    try {
      await stat(path.join(dir, candidate));
      candidate = `${stem}-${i}${ext}`;
      i++;
    } catch {
      return candidate;
    }
  }
}

async function listEntries(
  modelSlug: string,
  modelDir: string,
  colorSlug: string | null,
  catalog: Catalog,
): Promise<ImageEntry[]> {
  let dirents;
  try {
    dirents = await readdir(modelDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const entries: ImageEntry[] = [];

  for (const dirent of dirents) {
    if (dirent.isFile() && IMAGE_EXT_RE.test(dirent.name) && !dirent.name.startsWith(".")) {
      if (colorSlug) continue; // renk filtresi açıkken kök görseller hariç
      const info = await stat(path.join(modelDir, dirent.name)).catch(() => null);
      entries.push({
        filename: dirent.name,
        url: `/api/mock-images/${encodeURIComponent(modelSlug)}/${encodeURIComponent(dirent.name)}`,
        size: info?.size ?? 0,
        modifiedAt: info?.mtimeMs ?? 0,
      });
    } else if (dirent.isDirectory() && !dirent.name.startsWith(".") && dirent.name !== "_source") {
      if (colorSlug && dirent.name !== colorSlug) continue;
      const colorDir = path.join(modelDir, dirent.name);
      const files = await readdir(colorDir).catch(() => [] as string[]);
      for (const filename of files) {
        if (!IMAGE_EXT_RE.test(filename) || filename.startsWith(".")) continue;
        const info = await stat(path.join(colorDir, filename)).catch(() => null);
        entries.push({
          filename,
          url: `/api/mock-images/${encodeURIComponent(modelSlug)}/${encodeURIComponent(dirent.name)}/${encodeURIComponent(filename)}`,
          color: colorNameForSlug(catalog, dirent.name),
          colorSlug: dirent.name,
          size: info?.size ?? 0,
          modifiedAt: info?.mtimeMs ?? 0,
        });
      }
    }
  }

  return entries.sort((a, b) => b.modifiedAt - a.modifiedAt);
}

async function countAll(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  let modelDirs;
  try {
    modelDirs = await readdir(MOCK_ROOT, { withFileTypes: true });
  } catch {
    return counts;
  }

  for (const dirent of modelDirs) {
    if (!dirent.isDirectory() || dirent.name.startsWith(".") || dirent.name === "_source") continue;
    const modelDir = path.join(MOCK_ROOT, dirent.name);
    const children = await readdir(modelDir, { withFileTypes: true }).catch(() => []);
    let total = 0;
    for (const child of children) {
      if (child.name.startsWith(".")) continue;
      if (child.isFile() && IMAGE_EXT_RE.test(child.name)) total++;
      else if (child.isDirectory() && child.name !== "_source") {
        const files = await readdir(path.join(modelDir, child.name)).catch(() => []);
        total += files.filter((f) => IMAGE_EXT_RE.test(f) && !f.startsWith(".")).length;
      }
    }
    if (total > 0) counts[dirent.name] = total;
  }
  return counts;
}

// ── GET: ?model=slug → görsel listesi; paramsız → tüm model sayaçları ────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelSlug = searchParams.get("model");
    const colorParam = searchParams.get("color");

    if (!modelSlug) {
      const counts = await countAll();
      return NextResponse.json({ ok: true, counts });
    }

    if (!SLUG_RE.test(modelSlug)) {
      return NextResponse.json({ ok: false, error: "Geçersiz model slug." }, { status: 400 });
    }

    const catalog = readCatalog();
    const modelDir = path.join(MOCK_ROOT, modelSlug);
    const colorSlug = colorParam ? slugifyColorName(colorParam) : null;
    const entries = await listEntries(modelSlug, modelDir, colorSlug, catalog);
    return NextResponse.json({ ok: true, images: entries });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Listeleme hatası" },
      { status: 500 },
    );
  }
}

// ── POST: çoklu yükleme (multipart) ──────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const modelSlug = String(formData.get("modelSlug") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();

    if (!SLUG_RE.test(modelSlug)) {
      return NextResponse.json(
        { ok: false, error: "Geçersiz model slug. (yalnızca a-z, 0-9, -)" },
        { status: 400 },
      );
    }

    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: "En az bir görsel dosyası gerekli." }, { status: 400 });
    }
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { ok: false, error: `Tek istekte en fazla ${MAX_FILES_PER_REQUEST} dosya yükleyebilirsiniz.` },
        { status: 400 },
      );
    }

    const colorSlug = color ? slugifyColorName(color) : "";
    const targetDir = colorSlug
      ? path.join(MOCK_ROOT, modelSlug, colorSlug)
      : path.join(MOCK_ROOT, modelSlug);
    await mkdir(targetDir, { recursive: true });

    const saved: ImageEntry[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        errors.push(`${file.name}: desteklenmeyen uzantı`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`${file.name}: dosya boyutu 20MB sınırını aşıyor`);
        continue;
      }

      const filename = await uniqueFilename(targetDir, safeFilename(file.name));
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(targetDir, filename), buffer);

      saved.push({
        filename,
        url: `/api/mock-images/${encodeURIComponent(modelSlug)}${colorSlug ? `/${encodeURIComponent(colorSlug)}` : ""}/${encodeURIComponent(filename)}`,
        ...(colorSlug ? { color, colorSlug } : {}),
        size: buffer.byteLength,
        modifiedAt: Date.now(),
      });
    }

    if (saved.length > 0) bumpMockImageVersion();

    return NextResponse.json({
      ok: saved.length > 0,
      images: saved,
      errors,
      savedCount: saved.length,
      failedCount: errors.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Yükleme hatası" },
      { status: 500 },
    );
  }
}

// ── PATCH: görselin rengini değiştirme (klasörler arası taşıma) ──────────────
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const modelSlug = String(body?.modelSlug ?? "").trim();
    const filename = String(body?.filename ?? "").trim();
    const fromColor = String(body?.fromColor ?? "").trim();
    const toColor = String(body?.toColor ?? "").trim();

    if (!SLUG_RE.test(modelSlug) || !filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ ok: false, error: "Geçersiz parametre." }, { status: 400 });
    }

    const modelDir = path.join(MOCK_ROOT, modelSlug);
    const fromDir = fromColor ? path.join(modelDir, slugifyColorName(fromColor)) : modelDir;
    const toSlug = toColor ? slugifyColorName(toColor) : "";
    const toDir = toSlug ? path.join(modelDir, toSlug) : modelDir;

    const fromPath = path.join(fromDir, filename);
    if (!(await stat(fromPath).catch(() => null))) {
      return NextResponse.json({ ok: false, error: "Görsel bulunamadı." }, { status: 404 });
    }

    await mkdir(toDir, { recursive: true });
    const targetName = await uniqueFilename(toDir, filename);
    await fsRename(fromPath, path.join(toDir, targetName));

    // Boşalan renk klasörünü temizle
    if (fromColor && fromDir !== toDir) {
      const left = await readdir(fromDir).catch(() => []);
      if (left.filter((f) => IMAGE_EXT_RE.test(f)).length === 0) {
        await rmdir(fromDir).catch(() => {});
      }
    }

    bumpMockImageVersion();
    return NextResponse.json({
      ok: true,
      filename: targetName,
      color: toColor || undefined,
      colorSlug: toSlug || undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Taşıma hatası" },
      { status: 500 },
    );
  }
}

// ── DELETE: tekil/toplu silme ────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const modelSlug = String(body?.modelSlug ?? "").trim();
    if (!SLUG_RE.test(modelSlug)) {
      return NextResponse.json({ ok: false, error: "Geçersiz model slug." }, { status: 400 });
    }

    const items: { filename: string; color?: string }[] = Array.isArray(body?.items)
      ? body.items
      : body?.filename
        ? [{ filename: String(body.filename), color: body.color ? String(body.color) : undefined }]
        : [];

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "Silinecek görsel belirtilmedi." }, { status: 400 });
    }

    const modelDir = path.join(MOCK_ROOT, modelSlug);
    let deleted = 0;
    const notFound: string[] = [];

    for (const item of items.slice(0, MAX_FILES_PER_REQUEST)) {
      const filename = String(item.filename ?? "").trim();
      if (!filename || filename.includes("..") || filename.includes("/")) continue;
      const color = item.color ? slugifyColorName(String(item.color)) : "";
      const dir = color ? path.join(modelDir, color) : modelDir;
      const filePath = path.join(dir, filename);
      try {
        await unlink(filePath);
        deleted++;
      } catch {
        notFound.push(filename);
      }
    }

    if (deleted > 0) bumpMockImageVersion();
    return NextResponse.json({ ok: deleted > 0, deleted, notFound });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Silme hatası" },
      { status: 500 },
    );
  }
}
