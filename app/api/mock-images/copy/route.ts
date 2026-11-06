import { NextResponse } from "next/server";
import { z } from "zod";

import { copyMockImageToUploads, segmentsFromMockImageUrl } from "@/lib/mock-image-pool";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ url: z.string().min(1) });

// Havuz görselini sunucuda uploads/ altına kopyalar (telefona indirip geri yüklemeye gerek yok).
// Yanıt biçimi /api/upload ile aynıdır: { ok, imageUrl, imagePath }.
export async function POST(request: Request) {
  try {
    const { url } = bodySchema.parse(await request.json());
    const segments = segmentsFromMockImageUrl(url);
    if (!segments) {
      return NextResponse.json({ ok: false, error: "Geçersiz mock görsel adresi." }, { status: 400 });
    }
    const saved = await copyMockImageToUploads(segments);
    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kopyalama başarısız.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
