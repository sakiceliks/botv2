import { NextResponse } from "next/server";

import { analyzeWithGroq } from "@/lib/groq";
import { uploadToImgbb } from "@/lib/imgbb";
import { normalizeListingDraft } from "@/lib/normalization";
import { saveFormFile, saveFromPath } from "@/lib/storage";

export const maxDuration = 60; // 60 seconds

export async function POST(request: Request) {
  const traceId = `analyze_${Date.now()}`;
  console.log(`[${traceId}] Akıllı telefon analizi istegi alindi.`);

  try {
    const contentType = request.headers.get("content-type") || "";

    let savedImage: { fullPath: string; relativePath: string };

    if (contentType.includes("application/json")) {
      const { imagePath } = (await request.json()) as { imagePath: string };
      if (!imagePath) {
        return NextResponse.json({ error: "imagePath zorunlu." }, { status: 400 });
      }
      savedImage = await saveFromPath(imagePath.trim());
    } else {
      const formData = await request.formData();
      const file = formData.get("image");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Gorsel dosyasi zorunlu." }, { status: 400 });
      }
      savedImage = await saveFormFile(file);
    }

    const { imageUrl } = await uploadToImgbb(savedImage.fullPath);

    console.log(`[${traceId}] Groq Llama 4 Vision analizi basliyor...`);
    const groqRaw = await analyzeWithGroq(null, imageUrl);

    const draft = normalizeListingDraft(groqRaw, {
      imageUrl,
      imagePath: savedImage.relativePath,
    });

    return NextResponse.json({
      ok: true,
      draft
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
    console.error(`[${traceId}] HATA:`, errorMsg);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
