import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (!segments || segments.length === 0 || segments.length > 2) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Dizin geçişine karşı güvenlik
  if (segments.some(s => s.includes(".."))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "mock-image", ...segments);

  try {
    const buffer = await readFile(filePath);
    const filename = segments[segments.length - 1];
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === ".png"  ? "image/png"  :
      ext === ".gif"  ? "image/gif"  :
      ext === ".webp" ? "image/webp" :
      "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
