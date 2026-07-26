import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { COLORS, MODEL_COLORS } from "@/lib/manual-data";

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp)$/i;

function slugifyColorName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

const KNOWN_COLOR_SLUGS: Record<string, string> = (() => {
  const allColors = new Set<string>(COLORS);
  for (const list of Object.values(MODEL_COLORS)) {
    for (const color of list) allColors.add(color);
  }
  const map: Record<string, string> = {};
  for (const color of allColors) {
    map[slugifyColorName(color)] = color;
  }
  return map;
})();

type MockImageEntry = { filename: string; url: string; color?: string };

async function listModelImages(modelDir: string, urlPrefix: string): Promise<MockImageEntry[]> {
  const entries = await readdir(modelDir, { withFileTypes: true });
  const images: MockImageEntry[] = [];

  for (const entry of entries) {
    if (entry.isFile() && IMAGE_EXT_RE.test(entry.name)) {
      images.push({
        filename: entry.name,
        url: `${urlPrefix}/${encodeURIComponent(entry.name)}`,
      });
    } else if (entry.isDirectory()) {
      const colorName = KNOWN_COLOR_SLUGS[entry.name.toLowerCase()];
      if (!colorName) continue;

      const colorEntries = await readdir(path.join(modelDir, entry.name), { withFileTypes: true }).catch(() => []);
      for (const colorEntry of colorEntries) {
        if (colorEntry.isFile() && IMAGE_EXT_RE.test(colorEntry.name)) {
          images.push({
            filename: colorEntry.name,
            url: `${urlPrefix}/${encodeURIComponent(entry.name)}/${encodeURIComponent(colorEntry.name)}`,
            color: colorName,
          });
        }
      }
    }
  }

  return images;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelSlug = searchParams.get("model");

    const baseDir = path.join(process.cwd(), "mock-image");

    if (modelSlug && /^[a-z0-9-]+$/.test(modelSlug)) {
      const modelDir = path.join(baseDir, modelSlug);
      try {
        const images = await listModelImages(modelDir, `/api/mock-images/${encodeURIComponent(modelSlug)}`);
        if (images.length > 0) {
          return NextResponse.json({ ok: true, images });
        }
      } catch {
        // Model klasörü yok, root'tan devam et
      }
    }

    const files = await readdir(baseDir);
    const images = files
      .filter(f => IMAGE_EXT_RE.test(f))
      .map(f => ({
        filename: f,
        url: `/api/mock-images/${encodeURIComponent(f)}`
      }));
    return NextResponse.json({ ok: true, images });
  } catch {
    return NextResponse.json({ ok: false, error: "Mock images directory not found" }, { status: 500 });
  }
}
