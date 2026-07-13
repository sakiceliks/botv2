import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelSlug = searchParams.get("model");

    const baseDir = path.join(process.cwd(), "mock-image");
    let targetDir = baseDir;
    let urlPrefix = "/api/mock-images";

    if (modelSlug && /^[a-z0-9-]+$/.test(modelSlug)) {
      const modelDir = path.join(baseDir, modelSlug);
      try {
        const entries = await readdir(modelDir);
        const hasImages = entries.some(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        if (hasImages) {
          targetDir = modelDir;
          urlPrefix = `/api/mock-images/${encodeURIComponent(modelSlug)}`;
        }
      } catch {
        // Model klasörü yok, root'tan devam et
      }
    }

    const files = await readdir(targetDir);
    const images = files
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `${urlPrefix}/${encodeURIComponent(f)}`
      }));
    return NextResponse.json({ ok: true, images });
  } catch {
    return NextResponse.json({ ok: false, error: "Mock images directory not found" }, { status: 500 });
  }
}
