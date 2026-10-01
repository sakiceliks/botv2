import { createHash } from "node:crypto";
import fs from "node:fs";
import { appendFile, mkdir, open, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { getTitleCode, titleKey, withTitleCode } from "@/lib/title-code";
import type { ListingDraft, PublishMode } from "@/lib/types";

// ── Yayın logu ────────────────────────────────────────────────────────────────
// Her yayın denemesi data/publish-log/YYYY-MM.jsonl dosyasına bir satır olarak eklenir
// ve MongoDB'deki PublishLog koleksiyonuna yedeklenir. Bu modülde silme/güncelleme yoktur.

export type PublishLogEntry = {
  id: string;
  createdAt: string;
  mode: PublishMode;
  ok: boolean;
  submitted: boolean;
  error?: string;
  durationSec: number;
  finalUrl?: string;
  classifiedId?: string;
  queueId?: string;
  attempt?: number;
  title: string;
  titleKey: string;
  originalTitle: string;
  brand: string;
  model: string;
  color?: string;
  storage?: string;
  price: number;
  town?: string;
  quarter?: string;
  description: string;
  imagePath?: string;
  imageHash?: string;
  imageReused?: boolean;
  logs: string[];
};

export type PublishLogSummary = Omit<PublishLogEntry, "logs" | "description"> & { logCount: number };

const MONGO_TIMEOUT_MS = 3000;

function getLogDir() {
  return process.env.PUBLISH_LOG_DIR || path.join(process.cwd(), "data", "publish-log");
}

function monthFileName(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}.jsonl`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`MongoDB ${ms}ms içinde yanıt vermedi`)), ms)),
  ]);
}

// MongoDB'ye ulaşılamazsa bir süre denenmez; her işlem timeout beklemesin
const MONGO_RETRY_AFTER_MS = 60_000;
let mongoDownUntil = 0;

async function getPublishLogModel() {
  if (Date.now() < mongoDownUntil) throw new Error("MongoDB şu an erişilemiyor (bekleme süresinde)");
  try {
    const [{ default: connectDB }, { default: PublishLog }] = await Promise.all([
      import("@/lib/mongodb"),
      import("@/models/PublishLog"),
    ]);
    await withTimeout(connectDB(), MONGO_TIMEOUT_MS);
    return PublishLog;
  } catch (error) {
    mongoDownUntil = Date.now() + MONGO_RETRY_AFTER_MS;
    throw error;
  }
}

export function createPublishLogId() {
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toSummary(entry: PublishLogEntry): PublishLogSummary {
  const { logs, description: _description, ...rest } = entry;
  return { ...rest, logCount: logs?.length ?? 0 };
}

// ── Yazma ─────────────────────────────────────────────────────────────────────
export async function appendPublishLog(entry: PublishLogEntry) {
  const dir = getLogDir();
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, monthFileName(new Date(entry.createdAt))), JSON.stringify(entry) + "\n", "utf-8");

  try {
    const PublishLog = await getPublishLogModel();
    await withTimeout(PublishLog.create(entry), MONGO_TIMEOUT_MS);
  } catch (error) {
    console.error("[PUBLISH-LOG] MongoDB yedeği yazılamadı (dosya kaydı tamam):", error instanceof Error ? error.message : error);
  }
}

// ── Okuma ─────────────────────────────────────────────────────────────────────
// Dosyalar sadece büyüdüğü için her dosyanın okunan kısmı bellekte tutulur, sonraki okumalarda
// sadece yeni eklenen satırlar ayrıştırılır.
const fileCache = new Map<string, { offset: number; summaries: PublishLogSummary[] }>();

async function listLogFiles() {
  const dir = getLogDir();
  const names = await readdir(dir).catch(() => [] as string[]);
  return names.filter((n) => /^\d{4}-\d{2}\.jsonl$/.test(n)).sort().map((n) => path.join(dir, n));
}

async function readNewLines(file: string) {
  const cached = fileCache.get(file) ?? { offset: 0, summaries: [] };
  const { size } = await stat(file);
  if (size > cached.offset) {
    const handle = await open(file, "r");
    try {
      const buffer = Buffer.alloc(size - cached.offset);
      await handle.read(buffer, 0, buffer.length, cached.offset);
      const text = buffer.toString("utf-8");
      const lastNewline = text.lastIndexOf("\n");
      if (lastNewline >= 0) {
        for (const line of text.slice(0, lastNewline).split("\n")) {
          if (!line.trim()) continue;
          try {
            cached.summaries.push(toSummary(JSON.parse(line)));
          } catch {
            console.error("[PUBLISH-LOG] Bozuk satır atlandı:", file);
          }
        }
        cached.offset += Buffer.byteLength(text.slice(0, lastNewline + 1), "utf-8");
      }
    } finally {
      await handle.close();
    }
  }
  fileCache.set(file, cached);
  return cached.summaries;
}

async function readFileSummaries(): Promise<PublishLogSummary[]> {
  const all: PublishLogSummary[] = [];
  for (const file of await listLogFiles()) {
    all.push(...(await readNewLines(file)));
  }
  return all;
}

async function readMongoSummaries(filter: Record<string, unknown> = {}, limit = 0): Promise<PublishLogSummary[]> {
  try {
    const PublishLog = await getPublishLogModel();
    let query = PublishLog.find(filter).select("-logs -description -_id -__v").sort({ createdAt: -1 });
    if (limit) query = query.limit(limit);
    const docs = (await withTimeout(query.lean().exec(), MONGO_TIMEOUT_MS)) as unknown as PublishLogSummary[];
    return docs.map((d) => ({ ...d, logCount: d.logCount ?? 0 }));
  } catch (error) {
    console.error("[PUBLISH-LOG] MongoDB okunamadı, sadece dosya kullanılıyor:", error instanceof Error ? error.message : error);
    return [];
  }
}

function mergeById(...lists: PublishLogSummary[][]) {
  const byId = new Map<string, PublishLogSummary>();
  for (const list of lists) {
    for (const item of list) if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPublishLog({ limit = 300, q = "" }: { limit?: number; q?: string } = {}) {
  const merged = mergeById(await readFileSummaries(), await readMongoSummaries({}, limit));
  const needle = titleKey(q);
  const filtered = needle
    ? merged.filter((e) =>
        titleKey([e.title, e.brand, e.model, e.color, e.town, e.classifiedId, e.queueId].filter(Boolean).join(" ")).includes(needle),
      )
    : merged;
  return {
    total: merged.length,
    published: merged.filter((e) => e.mode === "publish" && e.ok).length,
    failed: merged.filter((e) => !e.ok).length,
    entries: filtered.slice(0, limit),
  };
}

export async function getPublishLogEntry(id: string): Promise<PublishLogEntry | null> {
  const marker = `"id":${JSON.stringify(id)}`;
  for (const file of (await listLogFiles()).reverse()) {
    const text = await readFile(file, "utf-8");
    const line = text.split("\n").find((l) => l.includes(marker));
    if (line) return JSON.parse(line);
  }
  try {
    const PublishLog = await getPublishLogModel();
    const doc = await withTimeout(PublishLog.findOne({ id }).select("-_id -__v").lean().exec(), MONGO_TIMEOUT_MS);
    return (doc as unknown as PublishLogEntry) ?? null;
  } catch {
    return null;
  }
}

// ── Mükerrer kontrolü ─────────────────────────────────────────────────────────
// Yayınlanmış ya da son onay adımına kadar gitmiş (submitted) ilanlar "kullanılmış" sayılır.
function isUsed(e: Pick<PublishLogSummary, "mode" | "ok" | "submitted">) {
  return e.mode === "publish" && (e.ok || e.submitted);
}

async function getUsedSummaries() {
  const mongo = await readMongoSummaries({ mode: "publish", $or: [{ ok: true }, { submitted: true }] });
  return mergeById((await readFileSummaries()).filter(isUsed), mongo);
}

// Aynı kuyruk öğesi daha önce yayınlandı/son onaya kadar gittiyse kaydını döner
export async function findUsedByQueueId(queueId: string) {
  return (await getUsedSummaries()).find((e) => e.queueId === queueId) ?? null;
}

export async function getUsedTitleKeys() {
  return new Set((await getUsedSummaries()).map((e) => e.titleKey));
}

export async function getPublishedImageHashes() {
  return new Set((await getUsedSummaries()).map((e) => e.imageHash).filter((h): h is string => Boolean(h)));
}

// Başlığın sonunda kod yoksa eklenir; kodlu başlık daha önce kullanılmışsa kod yenilenir
export async function ensureUniqueTitle(title: string, used?: Set<string>) {
  const usedKeys = used ?? (await getUsedTitleKeys());
  const original = title.trim();
  if (getTitleCode(original) && !usedKeys.has(titleKey(original))) {
    return { title: original, note: null };
  }
  const next = withTitleCode(original, usedKeys);
  const note = getTitleCode(original)
    ? `Başlık daha önce kullanılmış, kod yenilendi: "${original}" → "${next}"`
    : `Başlığa benzersiz kod eklendi: "${next}"`;
  return { title: next, note };
}

// ── Görsel hash ───────────────────────────────────────────────────────────────
const hashCache = new Map<string, { mtimeMs: number; hash: string }>();

export function resolveLocalImagePath(draft: Pick<ListingDraft, "imagePath" | "imageUrl">): string | null {
  if (draft.imagePath) {
    const absolutePath = path.isAbsolute(draft.imagePath)
      ? draft.imagePath
      : path.join(process.cwd(), draft.imagePath.replace(/^\//, ""));
    if (fs.existsSync(absolutePath)) return absolutePath;
  }
  const imageUrl = String(draft.imageUrl || "");
  const idx = imageUrl.indexOf("/uploads/");
  if (idx >= 0) {
    const localPath = path.join(process.cwd(), "uploads", imageUrl.slice(idx + "/uploads/".length).split("?")[0]);
    if (fs.existsSync(localPath)) return localPath;
  }
  return null;
}

export async function hashImageFile(absPath: string): Promise<string | null> {
  try {
    const { mtimeMs } = await stat(absPath);
    const cached = hashCache.get(absPath);
    if (cached && cached.mtimeMs === mtimeMs) return cached.hash;
    const hash = createHash("sha1").update(await readFile(absPath)).digest("hex");
    hashCache.set(absPath, { mtimeMs, hash });
    return hash;
  } catch {
    return null;
  }
}
