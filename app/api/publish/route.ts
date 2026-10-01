import { NextResponse } from "next/server";
import { z } from "zod";

import {
  appendPublishLog,
  createPublishLogId,
  ensureUniqueTitle,
  findUsedByQueueId,
  getPublishedImageHashes,
  hashImageFile,
  resolveLocalImagePath,
} from "@/lib/publish-log";
import { publishListing } from "@/lib/puppeteer";
import { titleKey } from "@/lib/title-code";

const publishSchema = z.object({
  mode: z.enum(["draft", "publish"]),
  reviewedForPublish: z.boolean().optional(),
  queueId: z.string().optional(),
  attempt: z.number().optional(),
  draft: z.object({
    _id: z.string(),
    name: z.string(),
    slug: z.string(),
    brand: z.string(),
    model: z.string(),
    series: z.string(),
    product: z.string(),
    productType: z.string(),
    vehicleType: z.string(),
    condition: z.string(),
    category: z.string(),
    partCategory: z.string(),
    price: z.number(),
    description: z.string(),
    color: z.string().optional(),
    storage: z.string().optional(),
    origin: z.string().optional(),
    warranty: z.string().optional(),
    exchangeable: z.string().optional(),
    town: z.string().optional(),
    quarter: z.string().optional(),
    imageUrl: z.string(),
    imagePath: z.string(),
    inStock: z.boolean(),
    createdAt: z.string(),
    categoryPath: z.array(z.string()),
    confidence: z.number(),
    fieldConfidence: z.object({
      brand: z.number(),
      model: z.number(),
      vehicleType: z.number(),
      partCategory: z.number(),
      product: z.number()
    }),
    sourceHints: z.array(z.string()),
    warnings: z.array(z.string())
  })
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = publishSchema.parse(json);

    if (payload.mode === "publish" && payload.draft.warnings.length > 0 && !payload.reviewedForPublish) {
      return NextResponse.json(
        {
          ok: false,
          error: "Dusuk guvenli alanlar gozden gecirilmeden publish moduna gecilemez."
        },
        { status: 400 }
      );
    }

    if (!payload.draft.imagePath && !payload.draft.imageUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "İlanda görsel yok — sahibinden fotoğraf olmadan devam ettirmiyor. Kuyruğa eklemeden önce bir görsel ekleyin."
        },
        { status: 400 }
      );
    }

    // Son onaya kadar gitmiş bir kuyruk öğesi tekrar yayınlanmaz (mükerrer ilan olur)
    if (payload.mode === "publish" && payload.queueId) {
      const previous = await findUsedByQueueId(payload.queueId);
      if (previous) {
        return NextResponse.json({
          ok: false,
          submitted: true,
          alreadySubmitted: true,
          title: previous.title,
          error: `Bu ilan ${new Date(previous.createdAt).toLocaleString("tr-TR")} tarihinde zaten gönderildi ("${previous.title}"). Mükerrer olmaması için tekrar yayınlanmadı — gerekirse kuyruktan silip yeniden ekleyin.`,
          logs: [],
        });
      }
    }

    const startedAt = Date.now();
    const preLogs: string[] = [];
    const note = (message: string) =>
      preLogs.push(`⚠️ [${new Date().toLocaleTimeString("tr-TR", { hour12: false })}] ${message}`);

    // Mükerrer koruması: başlık kodlu ve daha önce kullanılmamış olmalı
    const unique = await ensureUniqueTitle(payload.draft.name);
    if (unique.note) note(unique.note);
    const draft = { ...payload.draft, name: unique.title };

    // Aynı görsel daha önce yayınlandıysa sadece uyar (yayın engellenmez)
    const imageFile = resolveLocalImagePath(draft);
    const imageHash = imageFile ? await hashImageFile(imageFile) : null;
    const imageReused = Boolean(imageHash && (await getPublishedImageHashes()).has(imageHash));
    if (imageReused) note("Bu görsel daha önce yayınlanan bir ilanda kullanıldı — sahibinden mükerrer sayabilir.");

    let result: Awaited<ReturnType<typeof publishListing>>;
    try {
      result = await publishListing(draft, payload.mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Yayinlama sirasinda hata olustu.";
      result = { ok: false, mode: payload.mode, logs: [`❌ ${message}`], error: message, submitted: false, title: draft.name };
    }

    const logs = [...preLogs, ...result.logs];
    const title = result.title || draft.name;
    // Bazı hata yolları `error` döndürmüyor; logdaki son hata satırını kullan
    const error = result.ok
      ? undefined
      : ("error" in result && result.error) || logs.filter((l) => l.startsWith("❌")).pop()?.replace(/^❌\s*(\[[^\]]*\]\s*)?(\([^)]*\)\s*)?/, "") || "Bilinmeyen hata";
    try {
      await appendPublishLog({
        id: createPublishLogId(),
        createdAt: new Date(startedAt).toISOString(),
        mode: payload.mode,
        ok: result.ok,
        submitted: result.submitted,
        error,
        durationSec: Math.round((Date.now() - startedAt) / 1000),
        finalUrl: result.finalUrl,
        classifiedId: result.classifiedId,
        queueId: payload.queueId,
        attempt: payload.attempt,
        title,
        titleKey: titleKey(title),
        originalTitle: payload.draft.name,
        brand: draft.brand,
        model: draft.model,
        color: draft.color,
        storage: draft.storage,
        price: draft.price,
        town: draft.town,
        quarter: draft.quarter,
        description: draft.description,
        imagePath: imageFile ?? draft.imagePath,
        imageHash: imageHash ?? undefined,
        imageReused,
        logs,
      });
    } catch (logError) {
      console.error("[PUBLISH-LOG] ❌ Yayın logu yazılamadı:", logError);
      logs.push(`❌ Yayın logu yazılamadı: ${logError instanceof Error ? logError.message : "?"}`);
    }

    return NextResponse.json({ ...result, error, logs, title, imageReused });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Yayinlama sirasinda hata olustu."
      },
      { status: 500 }
    );
  }
}
