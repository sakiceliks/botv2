// Kuyruk öğeleri için ÖĞE BAZLI MongoDB işlemleri (ekle / güncelle / sil / listele).
// Eski "tüm kuyruğu yaz" (upsert-all) kalktı: telefon ve masaüstü aynı anda açıkken
// "son yazan kazanır" yüzünden birbirinin değişikliğini ezmez.
import connectDB from "@/lib/mongodb";
import QueueItem from "@/models/QueueItem";

export type QueueItemRecord = {
  queueId: string;
  draft: Record<string, any>;
  preview?: string | null;
  status: "pending" | "running" | "done" | "error";
  errorMsg?: string | null;
  addedAt?: string;
  duration?: string | null;
  submittedAt?: Date | null;
  attempts?: number;
  seq?: number;
  updatedAt?: Date;
};

// Listede `logs` yok (ağır); son yayın logları /api/queue/status içinde.
const LIST_PROJECTION = {
  _id: 0,
  queueId: 1,
  draft: 1,
  preview: 1,
  status: 1,
  errorMsg: 1,
  addedAt: 1,
  duration: 1,
  submittedAt: 1,
  attempts: 1,
  seq: 1,
  updatedAt: 1,
} as const;

/** Eklenme sırası: seq (yeni kayıtlar), sonra createdAt, sonra _id. Eski kayıtlarda seq yok → başa gelir. */
export const QUEUE_ORDER = { seq: 1, createdAt: 1, _id: 1 } as const;

export async function listQueueItems(): Promise<QueueItemRecord[]> {
  await connectDB();
  return (await QueueItem.find({}, LIST_PROJECTION).sort(QUEUE_ORDER).lean()) as unknown as QueueItemRecord[];
}

export type NewQueueItem = {
  id: string;
  draft: Record<string, any>;
  preview?: string | null;
  addedAt?: string;
};

/** Yalnızca ekler: aynı queueId varsa dokunmaz. Yeni öğeler her zaman `pending` başlar. */
export async function addQueueItems(items: NewQueueItem[]): Promise<number> {
  if (items.length === 0) return 0;
  await connectDB();
  const base = Date.now() * 1000;
  const result = await QueueItem.bulkWrite(
    items.map((item, index) => ({
      updateOne: {
        filter: { queueId: item.id },
        update: {
          $setOnInsert: {
            queueId: item.id,
            draft: item.draft,
            preview: item.preview ?? undefined,
            status: "pending",
            addedAt: item.addedAt,
            seq: base + index,
          },
        },
        upsert: true,
      },
    })),
    { ordered: true },
  );
  return result.upsertedCount ?? 0;
}

export type QueueItemPatch = {
  /** Taslak alanları: yalnızca verilen alanlar güncellenir (tüm taslak ezilmez). */
  draft?: Record<string, unknown>;
  preview?: string | null;
};

export type PatchOutcome = "updated" | "not_found" | "locked";

/** Yayınlanan ya da yayınlanmış öğeye dokunulmaz (`locked`). */
export async function patchQueueItem(id: string, patch: QueueItemPatch): Promise<PatchOutcome> {
  await connectDB();
  const $set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch.draft ?? {})) {
    if (!/^[A-Za-z0-9_]+$/.test(key) || value === undefined) continue;
    $set[`draft.${key}`] = value;
  }
  if (patch.preview !== undefined) $set.preview = patch.preview ?? undefined;
  if (Object.keys($set).length === 0) {
    return (await QueueItem.exists({ queueId: id })) ? "updated" : "not_found";
  }

  const res = await QueueItem.updateOne({ queueId: id, status: { $nin: ["running", "done"] } }, { $set });
  if (res.matchedCount > 0) return "updated";
  return (await QueueItem.exists({ queueId: id })) ? "locked" : "not_found";
}

/** Yayınlanmakta olan öğe silinmez. */
export async function deleteQueueItem(id: string): Promise<PatchOutcome> {
  await connectDB();
  const res = await QueueItem.deleteOne({ queueId: id, status: { $ne: "running" } });
  if (res.deletedCount > 0) return "updated";
  return (await QueueItem.exists({ queueId: id })) ? "locked" : "not_found";
}

/** Tüm kuyruğu temizler; yayınlanmakta olan öğe kalır. */
export async function clearQueue(): Promise<{ deleted: number; keptRunning: number }> {
  await connectDB();
  const res = await QueueItem.deleteMany({ status: { $ne: "running" } });
  const keptRunning = await QueueItem.countDocuments({ status: "running" });
  return { deleted: res.deletedCount ?? 0, keptRunning };
}
