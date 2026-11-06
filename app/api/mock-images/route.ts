import { NextResponse } from "next/server";

import { cacheVersion, listPoolForModel } from "@/lib/mock-image-pool";

function withVersion(url: string, version: string): string {
  return version ? `${url}${version}` : url;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelSlug = searchParams.get("model");

    const version = await cacheVersion();
    const pool = await listPoolForModel(modelSlug);
    const images = pool.map((image) => ({
      filename: image.filename,
      url: withVersion(`/api/mock-images/${image.segments.map(encodeURIComponent).join("/")}`, version),
      ...(image.color ? { color: image.color } : {}),
    }));
    return NextResponse.json({ ok: true, images });
  } catch {
    return NextResponse.json({ ok: false, error: "Mock images directory not found" }, { status: 500 });
  }
}
