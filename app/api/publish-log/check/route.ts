import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getPublishedImageHashes,
  getUsedTitleKeys,
  hashImageFile,
  resolveLocalImagePath,
} from "@/lib/publish-log";
import { titleKey } from "@/lib/title-code";

const checkSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      imagePath: z.string().optional(),
      imageUrl: z.string().optional(),
    }),
  ),
});

// Kuyruktaki ilanların başlığı/görseli daha önce yayınlanmış mı?
export async function POST(request: Request) {
  try {
    const { items } = checkSchema.parse(await request.json());
    const [usedTitles, usedImages] = await Promise.all([getUsedTitleKeys(), getPublishedImageHashes()]);

    const results: Record<string, { titleUsed: boolean; imageUsed: boolean }> = {};
    for (const item of items) {
      const imageFile = resolveLocalImagePath({ imagePath: item.imagePath ?? "", imageUrl: item.imageUrl ?? "" });
      const hash = imageFile ? await hashImageFile(imageFile) : null;
      results[item.id] = {
        titleUsed: usedTitles.has(titleKey(item.title)),
        imageUsed: Boolean(hash && usedImages.has(hash)),
      };
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kontrol başarısız." },
      { status: 500 },
    );
  }
}
