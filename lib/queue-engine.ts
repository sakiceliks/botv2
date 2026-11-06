// Sunucu tarafı kuyruk motoru.
//
// Eskiden kuyruğu tarayıcı sekmesindeki bir döngü (app/page.tsx `startQueue`) ilerletiyordu; sekme
// kapanınca/uyuyunca kuyruk duruyordu. Artık döngü burada, sunucuda çalışır:
//   mock görsel havuzu yenile + görselleri yeniden bağla → her ilan için (oturum kontrolü →
//   mükerrer korumalı yayın → retry → bekleme) → Telegram raporu.
//
// Tekil örnek `globalThis` üzerinde tutulur (HMR / modülün birden çok bundle'a girmesine dayanıklı).
// Çift yayını önlemek için Mongo'daki tek doküman (models/QueueRun.ts) lease olarak kullanılır:
// heartbeat'i taze bir sahip varsa ikinci örnek (başka makine dahil) kuyruğu başlatamaz.
import os from "node:os";
import { randomUUID } from "node:crypto";

import { refreshMockImagePools } from "@/lib/mock-image-refresh";
import { copyMockImageToUploads, listModelPool, resolveModelSlug, type MockPoolImage } from "@/lib/mock-image-pool";
import connectDB from "@/lib/mongodb";
import { findUsedByQueueId } from "@/lib/publish-log";
import { runGuardedPublish, type GuardedPublishResult, type PublishListingFn } from "@/lib/publish-service";
import { QUEUE_ORDER } from "@/lib/queue-store";
import { readSettings } from "@/lib/settings";
import { formatQueueReport, sendTelegramMessage } from "@/lib/telegram";
import type { ListingDraft } from "@/lib/types";
import QueueItem from "@/models/QueueItem";
import QueueRun, { QUEUE_RUN_ID, type QueueRunStatus } from "@/models/QueueRun";

// ── Tipler ────────────────────────────────────────────────────────────────────────────────

export type AuthProbe = {
  status: "logged-in" | "logged-out" | "browser-closed" | "unknown";
  currentUrl?: string;
  message?: string;
};

export type EngineSettings = {
  maxRetries: number;
  queueDelaySeconds: number;
  telegramNotifyInterval: number;
};

export type EngineDeps = {
  /** lib/puppeteer.ts `publishListing` (testte sahte yayıncı enjekte edilir). */
  publishListing: PublishListingFn;
  /** Her yayın öncesi Sahibinden oturumunu yoklar. */
  checkAuth: () => Promise<AuthProbe>;
  sendTelegram: (text: string) => Promise<unknown>;
  readSettings: () => EngineSettings;
  /** Bekleyen ilanların model havuzlarını yeniler (python mock-image/images.py). */
  refreshPools: (slugs: string[]) => Promise<unknown>;
  /** Havuz yenilemesini/görsel yeniden bağlamayı tümden kapatmak için. */
  rebindImages: boolean;
  heartbeatMs: number;
  leaseTtlMs: number;
  /** "Çıkış yapılmış" tespitini doğrulamak için ikinci yoklamadan önce beklenen süre (ms). */
  authRecheckDelayMs: number;
  /** Yeniden deneme beklemesi (ms). */
  retryBackoffMs: (attempt: number) => number;
  instanceId: string;
  label: string;
};

export type StartResult =
  | { ok: true; started: true }
  | { ok: true; started: false; reason: "already_running" | "empty" }
  | { ok: false; started: false; reason: "busy"; message: string; owner?: string; heartbeatAgeSec?: number };

export type StopResult = { ok: true; state: "stopping" | "idle" | "cancelled_pause" | "recovered_stale" | "nothing_running" };

export type EngineStatus = {
  run: {
    /** Ekranda gösterilecek etkin durum. Lease'i bayat bir "running" kaydı `idle` + `stale: true` görünür. */
    status: QueueRunStatus;
    rawStatus: QueueRunStatus;
    active: boolean;
    stale: boolean;
    ownedHere: boolean;
    ownerLabel: string | null;
    heartbeatAt: string | null;
    heartbeatAgeSec: number | null;
    startedAt: string | null;
    finishedAt: string | null;
    currentQueueId: string | null;
    currentTitle: string | null;
    processed: number;
    success: number;
    failed: number;
    stopRequested: boolean;
    message: string | null;
    lastError: string | null;
  };
  logs: string[];
  counts: { pending: number; running: number; done: number; error: number; total: number };
  serverTime: string;
};

export type RecoveryOutcome = { queueId: string; title: string; outcome: "done" | "needs_check" | "pending" };

export type QueueEngine = {
  readonly instanceId: string;
  isLoopActive(): boolean;
  start(): Promise<StartResult>;
  stop(): Promise<StopResult>;
  getStatus(): Promise<EngineStatus>;
  /** Açılışta çağrılır: lease bayat/boşsa `running` kalmış öğeleri yayın loguna bakarak çözer. */
  recoverOnBoot(): Promise<{ skipped: boolean; recovered: RecoveryOutcome[] }>;
  /** Çalışan döngü bitene kadar bekler (testler için). */
  waitForIdle(): Promise<void>;
  /** Zamanlayıcıları temizler (testler için). */
  shutdown(): void;
};

// ── Sabitler / yardımcılar ────────────────────────────────────────────────────────────────

const MAX_LOG_LINES = 80;
const ITEM_LOG_TAIL = 80;
const REBIND_CONCURRENCY = 4;
const TELEGRAM_TIMEOUT_MS = 15_000;

const UNCERTAIN_MESSAGE =
  "Son onay adımı geçildi — ilan yayınlanmış olabilir, sahibinden'den kontrol edin (tekrar denenmedi).";

function clock() {
  return new Date().toLocaleTimeString("tr-TR", { hour12: false });
}

function sleepReal(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${what} ${ms}ms içinde yanıt vermedi`)), ms)),
  ]);
}

// Yayın sırasında Sahibinden bizi giriş sayfasına attıysa log satırlarında görünür.
const LOGIN_REDIRECT_RE = /URL:\s*https?:\/\/[^\s]*\/(?:giris|login)(?:[/?#\s]|$)/i;
export function looksLikeLoginFailure(logs: string[]): boolean {
  return logs.some((line) => LOGIN_REDIRECT_RE.test(line));
}

// ── Varsayılan bağımlılıklar ──────────────────────────────────────────────────────────────

function defaultDeps(): EngineDeps {
  const host = os.hostname();
  return {
    publishListing: async (listing, mode, hooks) => (await import("@/lib/puppeteer")).publishListing(listing, mode, hooks),
    checkAuth: async () => {
      const { detectSahibindenAuthStatus } = await import("@/lib/browser-auth");
      const result = await detectSahibindenAuthStatus();
      return { status: result.status, currentUrl: result.currentUrl, message: result.message };
    },
    sendTelegram: (text) => sendTelegramMessage(text),
    readSettings: () => {
      const s = readSettings();
      return {
        maxRetries: s.maxRetries ?? 2,
        queueDelaySeconds: s.queueDelaySeconds ?? 2,
        telegramNotifyInterval: s.telegramNotifyInterval || 10,
      };
    },
    refreshPools: (slugs) => refreshMockImagePools(slugs),
    rebindImages: true,
    heartbeatMs: 8_000,
    leaseTtlMs: 30_000,
    authRecheckDelayMs: 3_000,
    retryBackoffMs: (attempt) => attempt * 3000,
    instanceId: `${host}:${process.pid}:${randomUUID().slice(0, 6)}`,
    label: `${host} (pid ${process.pid})`,
  };
}

// ── Motor ─────────────────────────────────────────────────────────────────────────────────

export function createQueueEngine(overrides: Partial<EngineDeps> = {}): QueueEngine {
  const deps: EngineDeps = { ...defaultDeps(), ...overrides };

  // Yerel durum (bu süreçteki döngü)
  let loopPromise: Promise<void> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let stopRequested = false;
  let leaseLost = false;
  let logBuffer: string[] = [];
  let logsDirty = false;
  let heartbeatBusy = false;
  const counters = { processed: 0, success: 0, failed: 0, batchNumber: 0 };

  // ── Log ──
  function pushLog(line: string) {
    logBuffer.push(line.length > 400 ? `${line.slice(0, 400)}…` : line);
    if (logBuffer.length > MAX_LOG_LINES) logBuffer = logBuffer.slice(-MAX_LOG_LINES);
    logsDirty = true;
  }
  function eventLog(message: string) {
    const line = `🤖 [${clock()}] ${message}`;
    console.log(`[QUEUE] ${line}`);
    pushLog(line);
  }

  // ── Lease ──
  const leaseFilter = () => ({ _id: QUEUE_RUN_ID, ownerId: deps.instanceId });
  const isFresh = (doc: { ownerId?: string | null; heartbeatAt?: Date | null } | null | undefined) =>
    Boolean(doc?.ownerId && doc.heartbeatAt && Date.now() - new Date(doc.heartbeatAt).getTime() < deps.leaseTtlMs);

  async function acquireLease(status: QueueRunStatus): Promise<{ ok: true } | { ok: false; doc: any }> {
    await connectDB();
    const now = new Date();
    const staleBefore = new Date(now.getTime() - deps.leaseTtlMs);
    try {
      await QueueRun.findOneAndUpdate(
        {
          _id: QUEUE_RUN_ID,
          $or: [
            { ownerId: null },
            { ownerId: deps.instanceId },
            { heartbeatAt: null },
            { heartbeatAt: { $lt: staleBefore } },
          ],
        },
        {
          $set: {
            ownerId: deps.instanceId,
            ownerLabel: deps.label,
            heartbeatAt: now,
            status,
            startedAt: now,
            finishedAt: null,
            stopRequested: false,
            currentQueueId: null,
            currentTitle: null,
            processed: 0,
            success: 0,
            failed: 0,
            batchNumber: 0,
            message: null,
            lastError: null,
            recentLogs: [],
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      return { ok: true };
    } catch (error: any) {
      // Belge var ve filtreye uymuyor → upsert _id çakışması: lease taze bir sahipte
      if (error?.code === 11000) {
        return { ok: false, doc: await QueueRun.findById(QUEUE_RUN_ID).lean() };
      }
      throw error;
    }
  }

  /** Lease'i bırakır (yalnız hâlâ bizimse). `withRunStats`: döngünün sayaç/log tamponunu da yazar. */
  async function releaseLease(finalStatus: QueueRunStatus, extra: Record<string, unknown> = {}, withRunStats = true) {
    await QueueRun.updateOne(leaseFilter(), {
      $set: {
        ownerId: null,
        status: finalStatus,
        finishedAt: new Date(),
        currentQueueId: null,
        currentTitle: null,
        stopRequested: false,
        ...(withRunStats ? { recentLogs: logBuffer, ...counters } : {}),
        ...extra,
      },
    });
  }

  /** Bizim lease'imiz üzerinden alan yazar; lease kaybolmuşsa `leaseLost` işaretlenir. */
  async function patchRun(fields: Record<string, unknown>) {
    const res = await QueueRun.updateOne(leaseFilter(), {
      $set: { heartbeatAt: new Date(), ...(logsDirty ? { recentLogs: logBuffer } : {}), ...fields },
    });
    logsDirty = false;
    if (res.matchedCount === 0) leaseLost = true;
  }

  async function heartbeat() {
    if (heartbeatBusy) return;
    heartbeatBusy = true;
    try {
      const doc = (await QueueRun.findOneAndUpdate(
        leaseFilter(),
        { $set: { heartbeatAt: new Date(), ...(logsDirty ? { recentLogs: logBuffer } : {}) } },
        { returnDocument: "after", projection: { stopRequested: 1 } },
      ).lean()) as { stopRequested?: boolean } | null;
      logsDirty = false;
      if (!doc) leaseLost = true;
      else if (doc.stopRequested) stopRequested = true;
    } catch (error) {
      console.error("[QUEUE] Heartbeat yazılamadı:", error instanceof Error ? error.message : error);
    } finally {
      heartbeatBusy = false;
    }
  }

  // Bekleme: durdurma isteği ya da lease kaybında hemen uyanır
  async function wait(ms: number) {
    const end = Date.now() + ms;
    while (Date.now() < end && !stopRequested && !leaseLost) {
      await sleepReal(Math.min(250, Math.max(1, end - Date.now())));
    }
  }

  // ── Kuyruk öğesi işlemleri ──
  const claimable = (attempted: Set<string>) => ({
    status: { $in: ["pending", "error"] },
    submittedAt: null, // işaretli (belirsiz) öğeler ASLA otomatik yeniden yayınlanmaz
    queueId: { $nin: [...attempted] },
  });

  async function claimNextItem(attempted: Set<string>) {
    return QueueItem.findOneAndUpdate(
      claimable(attempted),
      {
        $set: { status: "running", runOwner: deps.instanceId, startedAt: new Date() },
        $unset: { errorMsg: "", finishedAt: "" },
        $inc: { attempts: 1 },
      },
      { sort: QUEUE_ORDER, returnDocument: "after" },
    ).lean() as Promise<any | null>;
  }

  async function hasClaimable(attempted: Set<string>) {
    return Boolean(await QueueItem.exists(claimable(attempted)));
  }

  /** Son onaydan önce kalıcı işaret. Öğe hâlâ bizim değilse (`false`) son onay verilmez. */
  async function markItemSubmitted(queueId: string): Promise<boolean> {
    const res = await QueueItem.updateOne(
      { queueId, runOwner: deps.instanceId, status: "running" },
      { $set: { submittedAt: new Date() } },
    );
    return res.matchedCount > 0 && !leaseLost;
  }

  async function finishItem(queueId: string, fields: Record<string, unknown>, unset: string[] = []) {
    const $unset: Record<string, ""> = { runOwner: "" };
    for (const key of unset) $unset[key] = "";
    await QueueItem.updateOne({ queueId, runOwner: deps.instanceId }, { $set: fields, $unset });
  }

  // ── Çökme / yarım kalan öğeleri çözme ──
  async function resolveRunningItems(): Promise<RecoveryOutcome[]> {
    const stuck = (await QueueItem.find({ status: "running" }).lean()) as any[];
    const outcomes: RecoveryOutcome[] = [];
    for (const item of stuck) {
      const title: string = item.draft?.name ?? item.queueId;
      const used = await findUsedByQueueId(item.queueId).catch(() => null);

      if (used?.ok) {
        // Yayın logunda başarılı kayıt var → tamamlanmış
        await QueueItem.updateOne(
          { queueId: item.queueId, status: "running" },
          {
            $set: {
              status: "done",
              duration: `${used.durationSec}s`,
              publishedAt: new Date(used.createdAt),
              "draft.name": used.title || title,
              finishedAt: new Date(),
            },
            $unset: { runOwner: "", errorMsg: "" },
          },
        );
        outcomes.push({ queueId: item.queueId, title, outcome: "done" });
      } else if (used || item.submittedAt) {
        // Son onay gönderilmiş ya da gönderilmek üzereydi, sonuç belirsiz → kontrol edilsin, yeniden yayınlama
        await QueueItem.updateOne(
          { queueId: item.queueId, status: "running" },
          { $set: { status: "error", errorMsg: UNCERTAIN_MESSAGE, finishedAt: new Date() }, $unset: { runOwner: "" } },
        );
        outcomes.push({ queueId: item.queueId, title, outcome: "needs_check" });
      } else {
        // Son onaya gelinmemiş → güvenle yeniden sıraya
        await QueueItem.updateOne(
          { queueId: item.queueId, status: "running" },
          { $set: { status: "pending" }, $unset: { runOwner: "", startedAt: "", errorMsg: "" } },
        );
        outcomes.push({ queueId: item.queueId, title, outcome: "pending" });
      }
    }
    return outcomes;
  }

  // Aynı süreçte kurtarma ile başlatma/durdurma çakışmasın
  let recoveryPromise: Promise<{ skipped: boolean; recovered: RecoveryOutcome[] }> | null = null;

  function recoverWithLease() {
    recoveryPromise ??= doRecoverWithLease().finally(() => {
      recoveryPromise = null;
    });
    return recoveryPromise;
  }

  async function doRecoverWithLease(): Promise<{ skipped: boolean; recovered: RecoveryOutcome[] }> {
    // Bu süreçte döngü çalışıyorsa `running` öğe bizimdir; dokunma
    if (loopPromise) return { skipped: true, recovered: [] };
    // Sahipsiz bir "giriş gerekli" duraklaması varsa bilgisini koru
    const before = (await QueueRun.findById(QUEUE_RUN_ID).lean()) as any;
    const keepPause = before?.status === "paused_login" && !before?.ownerId;

    const lease = await acquireLease("idle");
    if (!lease.ok) return { skipped: true, recovered: [] };
    const lines: string[] = [];
    try {
      const recovered = await resolveRunningItems();
      for (const r of recovered) {
        const line = `🤖 [${clock()}] Kurtarma: "${r.title}" → ${r.outcome}`;
        console.log(`[QUEUE] ${line}`);
        lines.push(line);
      }
      return { skipped: false, recovered };
    } finally {
      await releaseLease(
        keepPause ? "paused_login" : "idle",
        {
          startedAt: null,
          finishedAt: null,
          message: keepPause ? (before.message ?? null) : null,
          recentLogs: lines.length ? lines : (before?.recentLogs ?? []),
          processed: before?.processed ?? 0,
          success: before?.success ?? 0,
          failed: before?.failed ?? 0,
        },
        false,
      );
    }
  }

  // Açılışta lease hâlâ "taze" görünebilir (çöken sürecin son heartbeat'i). Sahibi gerçekten ölmüşse lease
  // bayatlayınca `running` kalmış öğeleri çözmek için hafif bir bekçi çalışır.
  let janitorTimer: ReturnType<typeof setInterval> | null = null;
  function startJanitor() {
    if (janitorTimer) return;
    janitorTimer = setInterval(async () => {
      try {
        if (loopPromise || recoveryPromise) return;
        const doc = (await QueueRun.findById(QUEUE_RUN_ID).lean()) as any;
        if (doc?.ownerId && isFresh(doc)) return;
        if (!(await QueueItem.exists({ status: "running" }))) return;
        const result = await recoverWithLease();
        if (!result.skipped && result.recovered.length > 0) {
          console.log(`[QUEUE] Bekçi kurtarması: ${result.recovered.map((r) => `${r.title} → ${r.outcome}`).join("; ")}`);
        }
      } catch (error) {
        console.error("[QUEUE] Bekçi hatası:", error instanceof Error ? error.message : error);
      }
    }, deps.leaseTtlMs);
    janitorTimer.unref?.();
  }

  // ── Görsel yenileme / yeniden bağlama (eski istemci mantığı) ──
  async function refreshAndRebind() {
    if (!deps.rebindImages) return;
    const pending = (await QueueItem.find({ status: { $in: ["pending", "error"] }, submittedAt: null }).lean()) as any[];
    if (pending.length === 0) {
      eventLog("Yenilenecek bekleyen ilan yok, havuz yenileme atlandı");
      return;
    }
    const slugOf = (item: any) => resolveModelSlug(item.draft?.brand ?? "", item.draft?.model ?? "");
    const slugs = [...new Set(pending.map(slugOf))];

    try {
      eventLog(`Mock görsel havuzu yenileniyor (${slugs.join(", ")})...`);
      const refreshed = (await deps.refreshPools(slugs)) as { ok?: boolean; error?: string } | undefined;
      eventLog(refreshed && refreshed.ok === false ? `Havuz yenileme sorunlu: ${refreshed.error ?? "?"}` : "Havuz yenilendi");
    } catch (error) {
      eventLog(`Havuz yenileme atlandı: ${error instanceof Error ? error.message : "?"}`);
    }
    if (stopRequested || leaseLost) return;

    const pools = new Map<string, MockPoolImage[]>();
    const norm = (v?: string) => (v ?? "").toLocaleLowerCase("tr-TR").trim();
    let cursor = 0;
    let rebound = 0;

    const worker = async () => {
      while (cursor < pending.length && !stopRequested && !leaseLost) {
        const item = pending[cursor++];
        try {
          const draft = item.draft ?? {};
          const slug = slugOf(item);
          let pool = pools.get(slug);
          if (!pool) {
            pool = await listModelPool(slug).catch(() => [] as MockPoolImage[]);
            pools.set(slug, pool);
          }
          if (pool.length === 0) continue;

          const colorMatches = draft.color ? pool.filter((i) => i.color && norm(i.color) === norm(draft.color)) : [];
          const candidates = colorMatches.length > 0 ? colorMatches : pool;
          const image = candidates[Math.floor(Math.random() * candidates.length)];
          const copied = await copyMockImageToUploads(image.segments);

          const $set: Record<string, unknown> = {
            "draft.imageUrl": copied.imageUrl,
            "draft.imagePath": copied.imagePath,
            preview: copied.imageUrl,
          };
          const color = image.color ?? draft.color;
          if (color) $set["draft.color"] = color;
          // Kullanıcı bu arada düzenlediyse/yayınlandıysa dokunma
          const res = await QueueItem.updateOne(
            { queueId: item.queueId, status: { $in: ["pending", "error"] }, submittedAt: null },
            { $set },
          );
          if (res.matchedCount > 0) rebound++;
        } catch (error) {
          console.warn("[QUEUE] Görsel yeniden bağlanamadı:", item.draft?.name, error);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(REBIND_CONCURRENCY, pending.length) }, () => worker()));
    eventLog(`${rebound}/${pending.length} bekleyen ilanın görseli yeniden bağlandı`);
  }

  // ── Telegram ──
  async function telegram(text: string) {
    try {
      await withTimeout(Promise.resolve(deps.sendTelegram(text)), TELEGRAM_TIMEOUT_MS, "Telegram");
    } catch (error) {
      console.warn("[QUEUE] Telegram gönderilemedi:", error instanceof Error ? error.message : error);
    }
  }

  // ── Ana döngü ──
  async function runLoop() {
    const settingsAtStart = deps.readSettings();
    const telegramInterval = Math.max(1, settingsAtStart.telegramNotifyInterval || 10);
    const attempted = new Set<string>();
    const batchErrorDetails: string[] = [];
    let finalStatus: QueueRunStatus = "idle";
    let finalMessage: string | null = null;
    let lastError: string | null = null;

    eventLog("Kuyruk başlatıldı");
    try {
      await patchRun({ status: "running", message: "Görseller hazırlanıyor" });
      await refreshAndRebind();

      while (true) {
        await heartbeat(); // durdurma bayrağını (başka örnekten gelmiş olabilir) ve lease'i tazele
        if (leaseLost) {
          eventLog("Lease başka bir örneğe geçti — döngü sonlandırılıyor");
          return; // lease bizim değil → hiçbir şey yazma
        }
        if (stopRequested) {
          eventLog("Kuyruk kullanıcı tarafından durduruldu");
          break;
        }
        if (!(await hasClaimable(attempted))) break;

        // ── Her yayın öncesi oturum kontrolü ──
        const loggedOut = await isLoggedOut();
        if (loggedOut) {
          finalStatus = "paused_login";
          finalMessage = "Sahibinden oturumu kapalı — giriş yapıp Devam Et'e basın.";
          eventLog(finalMessage);
          const remaining = await QueueItem.countDocuments({ status: { $in: ["pending", "error"] } });
          await telegram(
            `⚠️ <b>Giriş gerekli</b>\nSahibinden oturumu kapalı görünüyor; kuyruk duraklatıldı.\nGirişi yapıp “Devam Et”e basın. Kalan ilan: <b>${remaining}</b>`,
          );
          break;
        }

        const item = await claimNextItem(attempted);
        if (!item) break;
        const queueId: string = item.queueId;
        attempted.add(queueId);
        const draft = item.draft as ListingDraft;
        const maxRetries = Math.max(0, deps.readSettings().maxRetries ?? 2);
        const startedAt = Date.now();
        eventLog(`İşleniyor: ${draft.name}`);
        await patchRun({ currentQueueId: queueId, currentTitle: draft.name, ...counters, message: null });

        let success = false;
        let submittedUnconfirmed = false;
        let loginLost = false;
        let lastItemError: string | undefined;
        let lastLogs: string[] = [];
        let publishedTitle = draft.name;
        let attemptsMade = 0;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          if (attempt > 0) {
            if (stopRequested || leaseLost) break; // durdurma: yeniden deneme yok
            eventLog(`Yeniden deneniyor (${attempt}/${maxRetries}): ${publishedTitle}`);
            await wait(deps.retryBackoffMs(attempt));
            if (stopRequested || leaseLost) break;
          }
          attemptsMade++;

          let res: GuardedPublishResult;
          try {
            res = await runGuardedPublish(
              {
                draft: { ...draft, name: publishedTitle },
                mode: "publish",
                queueId,
                attempt: attempt + 1,
                onLog: pushLog,
                onBeforeSubmit: () => markItemSubmitted(queueId),
              },
              { publishListing: deps.publishListing },
            );
          } catch (error) {
            lastItemError = error instanceof Error ? error.message : "Yayınlama sırasında beklenmeyen hata";
            eventLog(`Kritik hata (${publishedTitle}): ${lastItemError}`);
            continue;
          }

          lastLogs = res.logs;
          // Sunucu mükerrer koruması için başlığa kod eklemiş/yenilemiş olabilir
          if (res.title && res.title !== publishedTitle) {
            publishedTitle = res.title;
            await QueueItem.updateOne({ queueId, runOwner: deps.instanceId }, { $set: { "draft.name": publishedTitle } });
          }
  
          if (res.ok) {
            success = true;
            break;
          }
          if (res.rejected) {
            lastItemError = res.error;
            eventLog(`İlan reddedildi: ${res.error}`);
            break; // doğrulama hatası → tekrar denemek anlamsız
          }
          if (res.submitted) {
            // Son onay gönderildi: ilan yayınlanmış olabilir, tekrar denemek mükerrer ilan açar
            submittedUnconfirmed = true;
            lastItemError = res.alreadySubmitted ? res.error : UNCERTAIN_MESSAGE;
            eventLog(`Son onaydan sonra hata (${publishedTitle}): ${res.error ?? "?"}`);
            break;
          }
          if (looksLikeLoginFailure(res.logs)) {
            loginLost = true;
            lastItemError = "Sahibinden oturumu kapanmış (giriş sayfasına yönlendirildi).";
            break;
          }
          lastItemError = res.error;
          eventLog(`Yayınlama hatası (${publishedTitle}): ${res.error ?? "?"}`);
        }

        const duration = `${Math.round((Date.now() - startedAt) / 1000)}s`;
        const logTail = lastLogs.slice(-ITEM_LOG_TAIL);

        if (loginLost) {
          // Öğeyi sıraya geri koy; yeniden denemeyi/hata saymayı atla, kuyruğu duraklat
          await finishItem(queueId, { status: "pending", logs: logTail }, ["errorMsg", "startedAt", "submittedAt"]);
          attempted.delete(queueId);
          finalStatus = "paused_login";
          finalMessage = "Sahibinden oturumu kapalı — giriş yapıp Devam Et'e basın.";
          eventLog(finalMessage);
          const remaining = await QueueItem.countDocuments({ status: { $in: ["pending", "error"] } });
          await telegram(
            `⚠️ <b>Giriş gerekli</b>\nYayın sırasında Sahibinden oturumu kapandı; kuyruk duraklatıldı.\nGirişi yapıp “Devam Et”e basın. Kalan ilan: <b>${remaining}</b>`,
          );
          break;
        }

        if (success) {
          await finishItem(
            queueId,
            { status: "done", duration, publishedAt: new Date(), finishedAt: new Date(), "draft.name": publishedTitle, logs: logTail },
            ["errorMsg"],
          );
          counters.success++;
          eventLog(`Başarıyla yayınlandı: ${publishedTitle} (${duration})`);
        } else {
          let errorMsg = lastItemError || "Bilinmeyen hata";
          if (!submittedUnconfirmed && stopRequested && attemptsMade <= maxRetries) {
            errorMsg += " (kuyruk durdurulduğu için yeniden denenmedi)";
          }
          // Son onay hiç gönderilmediyse (submitted false) olası "gönderilmek üzere" işaretini temizle
          await finishItem(
            queueId,
            { status: "error", errorMsg, duration, finishedAt: new Date(), "draft.name": publishedTitle, logs: logTail },
            submittedUnconfirmed ? [] : ["submittedAt"],
          );
          counters.failed++;
          lastError = errorMsg;
          batchErrorDetails.push(`${publishedTitle}: ${errorMsg}`);
          eventLog(
            submittedUnconfirmed
              ? `Yayın doğrulanamadı — tekrar denenmedi: ${publishedTitle}`
              : `Yayınlama hatası (${attemptsMade} deneme): ${publishedTitle}: ${errorMsg}`,
          );
        }
        counters.processed++;

        if (counters.processed % telegramInterval === 0) {
          counters.batchNumber++;
          await telegram(
            formatQueueReport(counters.success, counters.failed, counters.processed, counters.batchNumber, batchErrorDetails),
          );
          batchErrorDetails.length = 0;
        }
        await patchRun({ currentQueueId: null, currentTitle: null, ...counters, lastError });

        if (stopRequested || leaseLost) continue; // üstte işlenir

        // İlanlar arası bekleme
        const delayMs = Math.max(0, deps.readSettings().queueDelaySeconds ?? 0) * 1000;
        if (delayMs > 0 && (await hasClaimable(attempted))) await wait(delayMs);
      }

      if (counters.processed > 0 && counters.processed % telegramInterval !== 0) {
        counters.batchNumber++;
        await telegram(
          formatQueueReport(counters.success, counters.failed, counters.processed, counters.batchNumber, batchErrorDetails),
        );
      }
      if (finalStatus === "idle") eventLog("Kuyruk işlemi tamamlandı");
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      finalMessage = `Kuyruk hatayla durdu: ${lastError}`;
      eventLog(finalMessage);
      console.error("[QUEUE] Döngü hatası:", error);
      // Yarım kalan öğe bizim elimizdeyse güvenli duruma çek
      try {
        await resolveOwnRunningItems();
      } catch {
        /* sonraki başlatmada kurtarılır */
      }
    } finally {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (!leaseLost) {
        try {
          await releaseLease(finalStatus, { message: finalMessage, lastError });
        } catch (error) {
          console.error("[QUEUE] Lease bırakılamadı:", error);
        }
      }
    }
  }

  async function resolveOwnRunningItems() {
    const mine = (await QueueItem.find({ status: "running", runOwner: deps.instanceId }).lean()) as any[];
    if (mine.length === 0) return;
    await resolveRunningItems();
  }

  async function isLoggedOut(): Promise<boolean> {
    const probe = async () => {
      try {
        const auth = await withTimeout(deps.checkAuth(), 45_000, "Oturum kontrolü");
        // Yalnız gerçekten incelenmiş bir Sahibinden sekmesi giriş sayfasındaysa say.
        // Tarayıcı kapalı / sekme yok / belirsiz → yayın denemesi yapılır (kendi sekmesini açar).
        return auth.status === "logged-out" && Boolean(auth.currentUrl);
      } catch {
        return false;
      }
    };
    if (!(await probe())) return false;
    // Geçici sayfa geçişlerinde yanlış alarm vermemek için bir kez daha doğrula
    await wait(deps.authRecheckDelayMs);
    return probe();
  }

  // ── Genel API ──
  function busyResult(doc: any): StartResult {
    const age = doc?.heartbeatAt ? Math.round((Date.now() - new Date(doc.heartbeatAt).getTime()) / 1000) : undefined;
    return {
      ok: false,
      started: false,
      reason: "busy",
      owner: doc?.ownerLabel ?? undefined,
      heartbeatAgeSec: age,
      message: `Kuyruk başka bir örnekte çalışıyor (${doc?.ownerLabel ?? "bilinmiyor"}${
        age !== undefined ? `, son sinyal ${age} sn önce` : ""
      }). Takılı kaldıysa ${Math.round(deps.leaseTtlMs / 1000)} sn sonra tekrar deneyin.`,
    };
  }

  async function start(): Promise<StartResult> {
    if (loopPromise) return { ok: true, started: false, reason: "already_running" };
    await connectDB();
    if (recoveryPromise) await recoveryPromise.catch(() => undefined);
    if (loopPromise) return { ok: true, started: false, reason: "already_running" };

    if (!(await hasClaimable(new Set()))) {
      // Sahipsiz "running" öğeler (çöken önceki süreç) önce çözülmeli; sonra yeniden sıraya girmiş olabilirler
      if (await QueueItem.exists({ status: "running" })) await recoverWithLease();
      if (!(await hasClaimable(new Set()))) {
        const doc = (await QueueRun.findById(QUEUE_RUN_ID).lean()) as any;
        if (doc?.ownerId && doc.ownerId !== deps.instanceId && isFresh(doc)) return busyResult(doc);
        return { ok: true, started: false, reason: "empty" };
      }
    }

    const lease = await acquireLease("running");
    if (!lease.ok) return busyResult(lease.doc);

    stopRequested = false;
    leaseLost = false;
    logBuffer = [];
    logsDirty = false;
    counters.processed = counters.success = counters.failed = counters.batchNumber = 0;

    // Lease'i aldığımıza göre `running` kalmış öğeler sahipsizdir → önce çöz
    try {
      const recovered = await resolveRunningItems();
      for (const r of recovered) eventLog(`Kurtarma: "${r.title}" → ${r.outcome}`);
    } catch (error) {
      console.error("[QUEUE] Başlangıç kurtarması başarısız:", error);
    }

    heartbeatTimer = setInterval(() => void heartbeat(), deps.heartbeatMs);
    heartbeatTimer.unref?.();
    loopPromise = runLoop().finally(() => {
      loopPromise = null;
    });
    return { ok: true, started: true };
  }

  async function stop(): Promise<StopResult> {
    await connectDB();
    stopRequested = loopPromise ? true : stopRequested;

    const doc = (await QueueRun.findById(QUEUE_RUN_ID).lean()) as any;
    if (!doc) return { ok: true, state: "nothing_running" };

    if (doc.ownerId && isFresh(doc)) {
      await QueueRun.updateOne(
        { _id: QUEUE_RUN_ID, ownerId: doc.ownerId },
        { $set: { stopRequested: true, status: "stopping" } },
      );
      return { ok: true, state: "stopping" };
    }
    if (doc.ownerId) {
      // Sahibi ölü: yarım kalan öğeleri çözüp kaydı sıfırla
      const result = await recoverWithLease();
      return { ok: true, state: result.skipped ? "nothing_running" : "recovered_stale" };
    }
    if (doc.status === "paused_login") {
      await QueueRun.updateOne({ _id: QUEUE_RUN_ID, ownerId: null }, { $set: { status: "idle", message: null } });
      return { ok: true, state: "cancelled_pause" };
    }
    return { ok: true, state: "nothing_running" };
  }

  async function getStatus(): Promise<EngineStatus> {
    await connectDB();
    const [doc, grouped] = await Promise.all([
      QueueRun.findById(QUEUE_RUN_ID).lean() as Promise<any | null>,
      QueueItem.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
    const counts = { pending: 0, running: 0, done: 0, error: 0, total: 0 };
    for (const row of grouped as { _id: keyof typeof counts; n: number }[]) {
      if (row._id in counts) counts[row._id] = row.n;
      counts.total += row.n;
    }

    const fresh = isFresh(doc);
    const rawStatus: QueueRunStatus = doc?.status ?? "idle";
    const holdsLease = Boolean(doc?.ownerId);
    const stale = holdsLease && !fresh;
    const active = holdsLease && fresh && (rawStatus === "running" || rawStatus === "stopping");
    const status: QueueRunStatus = stale && (rawStatus === "running" || rawStatus === "stopping") ? "idle" : rawStatus;
    const ownedHere = doc?.ownerId === deps.instanceId;
    const age = doc?.heartbeatAt ? Math.round((Date.now() - new Date(doc.heartbeatAt).getTime()) / 1000) : null;

    return {
      run: {
        status,
        rawStatus,
        active,
        stale,
        ownedHere,
        ownerLabel: doc?.ownerLabel ?? null,
        heartbeatAt: doc?.heartbeatAt ? new Date(doc.heartbeatAt).toISOString() : null,
        heartbeatAgeSec: age,
        startedAt: doc?.startedAt ? new Date(doc.startedAt).toISOString() : null,
        finishedAt: doc?.finishedAt ? new Date(doc.finishedAt).toISOString() : null,
        currentQueueId: active ? (doc?.currentQueueId ?? null) : null,
        currentTitle: active ? (doc?.currentTitle ?? null) : null,
        processed: doc?.processed ?? 0,
        success: doc?.success ?? 0,
        failed: doc?.failed ?? 0,
        stopRequested: Boolean(doc?.stopRequested),
        message: doc?.message ?? null,
        lastError: doc?.lastError ?? null,
      },
      // Bu örnekteki tampon DB'deki kopyadan daha tazedir
      logs: ownedHere && loopPromise ? logBuffer : (doc?.recentLogs ?? []),
      counts,
      serverTime: new Date().toISOString(),
    };
  }

  return {
    instanceId: deps.instanceId,
    isLoopActive: () => loopPromise !== null,
    start,
    stop,
    getStatus,
    recoverOnBoot: async () => {
      await connectDB();
      startJanitor();
      return recoverWithLease();
    },
    waitForIdle: async () => {
      while (loopPromise) await loopPromise.catch(() => undefined);
    },
    shutdown: () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      if (janitorTimer) clearInterval(janitorTimer);
      janitorTimer = null;
    },
  };
}

// ── Tekil örnek (globalThis) ────────────────────────────────────────────────────────────────

const REGISTRY_KEY = Symbol.for("ilanla.queue-engine");
type Registry = { engine?: QueueEngine; pending?: Promise<QueueEngine> };

// Yalnız geliştirme/test: QUEUE_ENGINE_TEST_DEPS=<mjs yolu> ile sahte yayıncı vb. enjekte edilir.
// Üretim derlemesinde (NODE_ENV=production) bu dal hiç çalışmaz.
async function loadTestOverrides(): Promise<Partial<EngineDeps>> {
  if (process.env.NODE_ENV === "production") return {};
  const file = process.env.QUEUE_ENGINE_TEST_DEPS;
  if (!file) return {};
  const { pathToFileURL } = await import("node:url");
  const mod = await import(/* webpackIgnore: true */ pathToFileURL(file).href);
  return ((mod as any).default ?? mod) as Partial<EngineDeps>;
}

export function getQueueEngine(): Promise<QueueEngine> {
  const registry = ((globalThis as any)[REGISTRY_KEY] ??= {}) as Registry;
  if (registry.engine) return Promise.resolve(registry.engine);
  registry.pending ??= loadTestOverrides().then((overrides) => {
    registry.engine = createQueueEngine(overrides);
    return registry.engine;
  });
  return registry.pending;
}
