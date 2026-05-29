import { NextResponse } from "next/server";
import { uploadToImgbb } from "@/lib/imgbb";
import { saveFromPath } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const { imagePath } = (await request.json()) as { imagePath: string };

    if (!imagePath || typeof imagePath !== "string") {
      return NextResponse.json({ error: "imagePath zorunlu." }, { status: 400 });
    }

    const savedImage = await saveFromPath(imagePath.trim());
    const { imageUrl } = await uploadToImgbb(savedImage.fullPath);

    return NextResponse.json({
      ok: true,
      imageUrl,
      imagePath: savedImage.relativePath,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
    console.error("[API/UPLOAD-PATH] ❌ Yükleme hatası:", error);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
