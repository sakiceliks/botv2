import { NextResponse } from "next/server";
import { saveFormFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Görsel dosyası zorunlu." }, { status: 400 });
    }

    const savedImage = await saveFormFile(file);

    return NextResponse.json({
      ok: true,
      imageUrl: savedImage.relativePath,
      imagePath: savedImage.relativePath,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
    console.error("[API/UPLOAD] ❌ Yükleme hatası:", error);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
