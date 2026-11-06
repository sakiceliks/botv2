// Ortak yayın akışı: hem POST /api/publish hem sunucu kuyruk motoru (lib/queue-engine.ts) bunu kullanır.
//
// Garantiler:
//  • Süreç içinde aynı anda tek yayın (lib/puppeteer.ts modül-global durum kullanır).
//  • Son onaya (adım-3) kadar gitmiş bir kuyruk öğesi bir daha yayınlanmaz (yayın logu + öğe işareti).
//  • Başlık daha önce kullanıldıysa benzersiz kod eklenir; aynı görsel tekrar kullanılırsa uyarı yazılır.
//  • Her deneme yayın loguna eklenir.
import {
  appendPublishLog,
  createPublishLogId,
  ensureUniqueTitle,
  findUsedByQueueId,
  getPublishedImageHashes,
  hashImageFile,
  resolveLocalImagePath,
} from "@/lib/publish-log";
import type { PublishHooks } from "@/lib/puppeteer";
import { titleKey } from "@/lib/title-code";
import type { ListingDraft, PublishMode } from "@/lib/types";

export type PublishListingFn = (
  listing: ListingDraft,
  mode: PublishMode,
  hooks?: PublishHooks,
) => Promise<{
  ok: boolean;
  mode: PublishMode;
  logs: string[];
  error?: string;
  submitted: boolean;
  title: string;
  finalUrl?: string;
  classifiedId?: string;
}>;

export type GuardedPublishInput = {
  draft: ListingDraft;
  mode: PublishMode;
  queueId?: string;
  attempt?: number;
  reviewedForPublish?: boolean;
  /** Yayın sırasında akan canlı log satırları. */
  onLog?: (line: string) => void;
  /** Adım-3 öncesi çağrılır (motor burada kalıcı "gönderilmek üzere" işareti yazar); `false` → son onay verilmez. */
  onBeforeSubmit?: () => Promise<void | boolean> | void | boolean;
};

export type GuardedPublishDeps = {
  publishListing?: PublishListingFn;
};

export type GuardedPublishResult = {
  ok: boolean;
  mode: PublishMode;
  submitted: boolean;
  alreadySubmitted?: boolean;
  /** İstek baştan reddedildi (doğrulama) — tekrar denemek anlamsız. */
  rejected?: boolean;
  status?: number;
  error?: string;
  title: string;
  logs: string[];
  finalUrl?: string;
  classifiedId?: string;
  imageReused?: boolean;
};

// ── Süreç içi tek yayın kilidi ────────────────────────────────────────────────────────────
const lockHolder = globalThis as unknown as { __ilanlaPublishChain?: Promise<unknown> };

export function withPublishLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = lockHolder.__ilanlaPublishChain ?? Promise.resolve();
  const run = previous.then(fn, fn);
  lockHolder.__ilanlaPublishChain = run.catch(() => undefined);
  return run;
}

// ── Kuyruk öğesi işareti ────────────────────────────────────────────────────────────────────
// Adım-3 öncesi yazılan `submittedAt` işareti varsa öğe sahibinden'de açılmış olabilir.
async function queueItemMarkedSubmitted(queueId: string): Promise<boolean> {
  try {
    const [{ default: connectDB }, { default: QueueItem }] = await Promise.all([
      import("@/lib/mongodb"),
      import("@/models/QueueItem"),
    ]);
    await connectDB();
    return Boolean(await QueueItem.exists({ queueId, submittedAt: { $exists: true, $ne: null } }));
  } catch (error) {
    console.error("[PUBLISH] Öğe işareti okunamadı:", error instanceof Error ? error.message : error);
    return false;
  }
}

function reject(mode: PublishMode, draft: ListingDraft, status: number, error: string): GuardedPublishResult {
  return { ok: false, mode, submitted: false, rejected: true, status, error, title: draft.name, logs: [] };
}

export async function runGuardedPublish(
  input: GuardedPublishInput,
  deps: GuardedPublishDeps = {},
): Promise<GuardedPublishResult> {
  const { draft: incoming, mode, queueId } = input;

  if (mode === "publish" && incoming.warnings.length > 0 && !input.reviewedForPublish) {
    return reject(mode, incoming, 400, "Dusuk guvenli alanlar gozden gecirilmeden publish moduna gecilemez.");
  }

  if (!incoming.imagePath && !incoming.imageUrl) {
    return reject(
      mode,
      incoming,
      400,
      "İlanda görsel yok — sahibinden fotoğraf olmadan devam ettirmiyor. Kuyruğa eklemeden önce bir görsel ekleyin.",
    );
  }

  // Son onaya kadar gitmiş bir kuyruk öğesi tekrar yayınlanmaz (mükerrer ilan olur)
  if (mode === "publish" && queueId) {
    const previous = await findUsedByQueueId(queueId);
    if (previous) {
      return {
        ok: false,
        mode,
        submitted: true,
        alreadySubmitted: true,
        title: previous.title,
        error: `Bu ilan ${new Date(previous.createdAt).toLocaleString("tr-TR")} tarihinde zaten gönderildi ("${previous.title}"). Mükerrer olmaması için tekrar yayınlanmadı — gerekirse kuyruktan silip yeniden ekleyin.`,
        logs: [],
      };
    }
    if (await queueItemMarkedSubmitted(queueId)) {
      return {
        ok: false,
        mode,
        submitted: true,
        alreadySubmitted: true,
        title: incoming.name,
        error:
          "Bu ilan için son onay adımı başlatılmıştı (yayın logu kaydı yok). Yayınlanmış olabilir — sahibinden'den kontrol edin. Mükerrer olmaması için tekrar yayınlanmadı; gerekirse kuyruktan silip yeniden ekleyin.",
        logs: [],
      };
    }
  }

  const publishListing = deps.publishListing ?? (await import("@/lib/puppeteer")).publishListing;

  return withPublishLock(async () => {
    const startedAt = Date.now();
    const preLogs: string[] = [];
    const note = (message: string) =>
      preLogs.push(`⚠️ [${new Date().toLocaleTimeString("tr-TR", { hour12: false })}] ${message}`);

    // Mükerrer koruması: başlık kodlu ve daha önce kullanılmamış olmalı
    const unique = await ensureUniqueTitle(incoming.name);
    if (unique.note) note(unique.note);
    const draft = { ...incoming, name: unique.title };

    // Aynı görsel daha önce yayınlandıysa sadece uyar (yayın engellenmez)
    const imageFile = resolveLocalImagePath(draft);
    const imageHash = imageFile ? await hashImageFile(imageFile) : null;
    const imageReused = Boolean(imageHash && (await getPublishedImageHashes()).has(imageHash));
    if (imageReused) note("Bu görsel daha önce yayınlanan bir ilanda kullanıldı — sahibinden mükerrer sayabilir.");

    for (const line of preLogs) input.onLog?.(line);

    let result: Awaited<ReturnType<PublishListingFn>>;
    try {
      result = await publishListing(draft, mode, { onLog: input.onLog, onBeforeSubmit: input.onBeforeSubmit });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Yayinlama sirasinda hata olustu.";
      result = { ok: false, mode, logs: [`❌ ${message}`], error: message, submitted: false, title: draft.name };
    }

    const logs = [...preLogs, ...result.logs];
    const title = result.title || draft.name;
    // Bazı hata yolları `error` döndürmüyor; logdaki son hata satırını kullan
    const error = result.ok
      ? undefined
      : result.error ||
        logs
          .filter((l) => l.startsWith("❌"))
          .pop()
          ?.replace(/^❌\s*(\[[^\]]*\]\s*)?(\([^)]*\)\s*)?/, "") ||
        "Bilinmeyen hata";

    try {
      await appendPublishLog({
        id: createPublishLogId(),
        createdAt: new Date(startedAt).toISOString(),
        mode,
        ok: result.ok,
        submitted: result.submitted,
        error,
        durationSec: Math.round((Date.now() - startedAt) / 1000),
        finalUrl: result.finalUrl,
        classifiedId: result.classifiedId,
        queueId,
        attempt: input.attempt,
        title,
        titleKey: titleKey(title),
        originalTitle: incoming.name,
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

    return {
      ok: result.ok,
      mode: result.mode,
      submitted: result.submitted,
      error,
      title,
      logs,
      finalUrl: result.finalUrl,
      classifiedId: result.classifiedId,
      imageReused,
    };
  });
}
