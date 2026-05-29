import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const mockDir = path.join(process.cwd(), "mock-image");
    const files = await readdir(mockDir);
    const images = files
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `/api/mock-images/${encodeURIComponent(f)}`
      }));
    return NextResponse.json({ ok: true, images });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Mock images directory not found" }, { status: 500 });
  }
}
