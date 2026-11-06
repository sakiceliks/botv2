"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  History,
  Layers,
  Plus,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { ListingDraft } from "@/lib/types";
import { getStorageForModel, withInstallmentEmphasis } from "@/lib/manual-data";
import SplashScreen from "./components/SplashScreen";
import { ManualListingForm } from "./components/ManualListingForm";
import { BulkAddModal } from "./components/BulkAddModal";
import { PublishQueue } from "./components/PublishQueue";
import type { QueueItem } from "./components/PublishQueue";
import { SahibindenAuthStatus } from "./components/SahibindenAuthStatus";
import { PublishHistory } from "./components/PublishHistory";
import { BotSettings } from "./components/BotSettings";
import { CatalogManager } from "./components/CatalogManager";
import MobileNavigation from "./components/Navigation";

const STORAGE_IN_TITLE_RE = /\b(?:64|128|256|512)\s*GB\b|\b(?:1|2)\s*TB\b/i;

function normalizeQueueDraft(draft: ListingDraft): ListingDraft {
  const expectedStorage = getStorageForModel(draft.model);
  const nameWithStorage = expectedStorage && draft.storage !== expectedStorage && STORAGE_IN_TITLE_RE.test(draft.name)
    ? draft.name.replace(STORAGE_IN_TITLE_RE, expectedStorage)
    : draft.name;
  const name = withInstallmentEmphasis(nameWithStorage);
  if (name === draft.name && (!expectedStorage || draft.storage === expectedStorage)) return draft;

  return {
    ...draft,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    storage: expectedStorage ?? draft.storage,
  };
}

// ── Sunucu kuyruk motoru durumu (GET /api/queue/status) ──────────────────────────────────
type RunStatus = "idle" | "running" | "stopping" | "paused_login";
type RunInfo = {
  status: RunStatus;
  active: boolean;
  stale: boolean;
  ownedHere: boolean;
  ownerLabel: string | null;
  currentQueueId: string | null;
  currentTitle: string | null;
  processed: number;
  success: number;
  failed: number;
  stopRequested: boolean;
  message: string | null;
  lastError: string | null;
  heartbeatAgeSec: number | null;
};

type QueueRecord = {
  queueId: string;
  draft: ListingDraft;
  preview?: string | null;
  status: QueueItem["status"];
  errorMsg?: string | null;
  addedAt?: string;
  duration?: string | null;
  updatedAt?: string;
};

const POLL_ACTIVE_MS = 3000;
const POLL_IDLE_MS = 5000;

// Değişen taslak alanlarını (öğe bazlı PATCH için) çıkarır
function draftDiff(before: ListingDraft, after: ListingDraft): Partial<ListingDraft> {
  const diff: Record<string, unknown> = {};
  for (const key of Object.keys(after) as (keyof ListingDraft)[]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) diff[key] = after[key];
  }
  return diff as Partial<ListingDraft>;
}

export default function Home() {
  // ── States ──────────────────────────────────────────────────────────────────
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [runInfo, setRunInfo] = useState<RunInfo | null>(null);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [showRunLogs, setShowRunLogs] = useState(false);
  const [starting, setStarting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState<"queue" | "history" | "settings" | "catalog">("queue");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const queueItemsRef = useRef<QueueItem[]>([]);
  queueItemsRef.current = queueItems;

  // Kuyruk yazan istekler sürerken polling sonucu uygulanmaz (iyimser güncellemeyi geri almasın)
  const mutationsInFlight = useRef(0);
  const lastItemsSig = useRef("");
  const prevStatuses = useRef<Map<string, QueueItem["status"]>>(new Map());
  const prevRunStatus = useRef<RunStatus | null>(null);
  const normalizedSent = useRef<Set<string>>(new Set());
  const runActiveRef = useRef(false);

  const queueRunning = Boolean(runInfo?.active);
  runActiveRef.current = queueRunning;
  const queueCurrentIndex = (() => {
    if (!runInfo?.currentQueueId) return null;
    const idx = queueItems.findIndex((i) => i.id === runInfo.currentQueueId);
    return idx >= 0 ? idx : null;
  })();

  // Kuyruk yazan bir isteği izler (polling çakışmasın diye sayaç tutar)
  const tracked = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    mutationsInFlight.current++;
    try {
      return await fn();
    } finally {
      mutationsInFlight.current--;
    }
  }, []);

  const jsonRequest = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", body: unknown) => {
      const res = await fetch("/api/queue", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        const error = new Error(data?.error || `İstek başarısız (${res.status})`) as Error & { status?: number };
        error.status = res.status;
        throw error;
      }
      return data;
    },
    []
  );

  // ── Sunucudan kuyruk + motor durumu (polling) ────────────────────────────────
  const pollOnce = useCallback(async (initial = false) => {
    if (!initial && mutationsInFlight.current > 0) return;
    try {
      const [queueRes, statusRes] = await Promise.all([
        fetch("/api/queue", { cache: "no-store" }),
        fetch("/api/queue/status", { cache: "no-store" }),
      ]);
      const queueData = await queueRes.json();
      const statusData = await statusRes.json().catch(() => null);
      if (!initial && mutationsInFlight.current > 0) return;

      if (queueData.ok) {
        const records: QueueRecord[] = queueData.items;
        const sig = records.map((r) => `${r.queueId}|${r.status}|${r.updatedAt ?? ""}`).join(";");
        if (sig !== lastItemsSig.current) {
          lastItemsSig.current = sig;
          const mapped: QueueItem[] = records.map((it) => {
            const draft = normalizeQueueDraft(it.draft);
            // Eski kayıtlarda kalan normalizasyon farkını sunucuya bir kez yaz
            if (draft !== it.draft && (it.status === "pending" || it.status === "error")) {
              const key = `${it.queueId}|${draft.name}`;
              if (!normalizedSent.current.has(key)) {
                normalizedSent.current.add(key);
                jsonRequest("PATCH", { id: it.queueId, patch: { draft: draftDiff(it.draft, draft) } }).catch(() =>
                  normalizedSent.current.delete(key)
                );
              }
            }
            return {
              id: it.queueId,
              draft,
              preview: it.preview ?? undefined,
              status: it.status,
              errorMsg: it.errorMsg ?? undefined,
              addedAt: it.addedAt ?? "",
              duration: it.duration ?? undefined,
            };
          });

          // Sunucudaki yayın sonuçlarını (başka cihazdan/arka planda) bildir
          for (const item of mapped) {
            const before = prevStatuses.current.get(item.id);
            if (before === "running" && item.status === "done") {
              toast.success("İlan başarıyla yüklendi", { description: `${item.draft.name}${item.duration ? ` (${item.duration})` : ""}` });
            } else if (before === "running" && item.status === "error") {
              toast.error("Yayınlama hatası", { description: item.errorMsg || item.draft.name });
            }
          }
          prevStatuses.current = new Map(mapped.map((i) => [i.id, i.status]));
          setQueueItems(mapped);
        }
      }

      if (statusData?.ok) {
        const run: RunInfo = statusData.run;
        const before = prevRunStatus.current;
        if (before && before !== run.status) {
          if (run.status === "paused_login") {
            toast.warning("Giriş gerekli", { description: "Sahibinden oturumu kapalı — giriş yapıp “Devam Et”e basın." });
          } else if (run.status === "idle" && (before === "running" || before === "stopping")) {
            toast.info(before === "stopping" ? "Kuyruk durduruldu" : "Kuyruk tamamlandı");
          }
        }
        prevRunStatus.current = run.status;
        setRunInfo(run);
        setRunLogs(statusData.logs ?? []);
      }
    } catch (err) {
      if (initial) console.error("[DB] ❌ Kuyruk yükleme hatası:", err);
    } finally {
      if (initial) setQueueLoading(false);
    }
  }, [jsonRequest]);

  useEffect(() => {
    setIsMounted(true);
    pollOnce(true);
  }, [pollOnce]);

  // Sekme görünürken 3–5 sn'de bir yokla; görünmezken dur, geri gelince hemen yenile.
  // (Kuyruk sunucuda ilerlediği için sekmenin açık olması gerekmez.)
  useEffect(() => {
    if (!isMounted) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const schedule = () => {
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (document.visibilityState === "visible") await pollOnce();
        if (!cancelled) schedule();
      }, runActiveRef.current ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") pollOnce();
    };
    document.addEventListener("visibilitychange", onVisible);
    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isMounted, pollOnce]);

  // ── Escape key closes modals ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isBulkModalOpen) setIsBulkModalOpen(false);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isBulkModalOpen]);

  // ── Queue Handlers (öğe bazlı: tüm kuyruk yazılmaz) ──────────────────────────
  const addItemsToQueue = useCallback(
    (entries: { draft: ListingDraft; preview: string | null }[]) => {
      const items: QueueItem[] = entries.map(({ draft, preview }) => ({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        draft: normalizeQueueDraft(draft),
        preview,
        status: "pending",
        addedAt: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      }));
      for (const item of items) console.log("[QUEUE] ➕ İlan kuyruğa eklendi:", item.draft.name);
      setQueueItems((prev) => [...prev, ...items]);
      tracked(() =>
        jsonRequest("POST", {
          items: items.map((i) => ({ id: i.id, draft: i.draft, preview: i.preview ?? null, addedAt: i.addedAt })),
        })
      )
        .catch((err) => {
          console.error("[QUEUE] Ekleme sync hatası:", err);
          toast.error("İlan sunucuya kaydedilemedi", { description: err instanceof Error ? err.message : undefined });
          const ids = new Set(items.map((i) => i.id));
          setQueueItems((prev) => prev.filter((i) => !ids.has(i.id)));
        })
        .finally(() => pollOnce());
    },
    [jsonRequest, pollOnce, tracked]
  );

  const addToQueue = useCallback(
    (draft: ListingDraft, preview: string | null) => addItemsToQueue([{ draft, preview }]),
    [addItemsToQueue]
  );

  const removeFromQueue = useCallback((id: string) => {
    const item = queueItemsRef.current.find(i => i.id === id);
    console.log("[QUEUE] ➖ İlan kuyruktan kaldırıldı:", item?.draft.name);
    setQueueItems((prev) => prev.filter((item) => item.id !== id));
    tracked(() => jsonRequest("DELETE", { id }))
      .catch((err) => {
        console.error("[QUEUE] Silme sync hatası:", err);
        toast.error("İlan silinemedi", { description: err instanceof Error ? err.message : undefined });
      })
      .finally(() => pollOnce());
  }, [jsonRequest, pollOnce, tracked]);

  const updateQueueItem = useCallback((id: string, patch: Partial<ListingDraft>) => {
    const current = queueItemsRef.current.find((i) => i.id === id);
    if (!current) return;
    console.log("[QUEUE] 📝 İlan güncellendi:", id, patch);
    const nextDraft = normalizeQueueDraft({ ...current.draft, ...patch });
    const changed = draftDiff(current.draft, nextDraft);
    setQueueItems((prev) => prev.map((item) => (item.id === id ? { ...item, draft: nextDraft } : item)));
    if (Object.keys(changed).length === 0) return;
    tracked(() => jsonRequest("PATCH", { id, patch: { draft: changed } }))
      .catch((err) => {
        console.error("[QUEUE] Güncelleme sync hatası:", err);
        toast.error("Değişiklik kaydedilemedi", { description: err instanceof Error ? err.message : undefined });
      })
      .finally(() => pollOnce());
  }, [jsonRequest, pollOnce, tracked]);

  const handleReset = useCallback(async () => {
    if (window.confirm("Kuyruğu tamamen temizlemek istediğine emin misin?")) {
      console.log("[SYSTEM] 🔄 Sistem sıfırlanıyor...");
      try {
        const data = await tracked(() => jsonRequest("DELETE", { clearAll: true }));
        // Yayınlanmakta olan ilan silinmez; listeyi sunucudan yeniden al
        lastItemsSig.current = "";
        await pollOnce();
        toast.success(data.keptRunning > 0 ? "Kuyruk temizlendi (yayınlanan ilan hariç)" : "Sistem ve Veritabanı sıfırlandı");
      } catch (err) {
        toast.error("Sıfırlama hatası");
      }
    }
  }, [jsonRequest, pollOnce, tracked]);

  // ── Queue Execution: döngü artık SUNUCUDA (lib/queue-engine.ts) ──────────────────
  const startQueue = async () => {
    if (starting || queueRunning) return;
    setStarting(true);
    try {
      const res = await fetch("/api/queue/run", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data?.ok === false) {
        toast.error("Kuyruk başlatılamadı", { description: data.message || data.error });
      } else if (data?.started === false && data?.reason === "empty") {
        toast.info("Kuyrukta yayınlanacak ilan yok");
      } else if (data?.started) {
        console.log("[BOT] 🚀 Kuyruk sunucuda başlatıldı");
        toast.success("Kuyruk sunucuda başladı", { description: "Bu sekmeyi kapatsanız da devam eder." });
      }
    } catch {
      toast.error("Kuyruk başlatılamadı", { description: "Sunucuya ulaşılamadı." });
    } finally {
      setStarting(false);
      lastItemsSig.current = "";
      await pollOnce();
    }
  };

  const stopQueue = async () => {
    try {
      const res = await fetch("/api/queue/stop", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data?.ok === false) {
        toast.error("Kuyruk durdurulamadı", { description: data.error });
      } else {
        toast.info("Durdurma istendi", { description: "Mevcut ilan bittikten sonra kuyruk duracak." });
      }
    } catch {
      toast.error("Kuyruk durdurulamadı", { description: "Sunucuya ulaşılamadı." });
    } finally {
      lastItemsSig.current = "";
      await pollOnce();
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-[#0d1117] text-zinc-300 font-sans overflow-hidden">
      {/* ── Sidebar (Aside) ── */}
      <aside
        className={cn(
          "border-r border-white/5 hidden lg:flex flex-col flex-shrink-0 bg-[#0d1117] transition-all duration-300 overflow-hidden",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn(
          "flex items-center border-b border-white/5 h-16",
          sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"
        )}>
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "hidden")}>
            <div className="w-8 h-8 rounded-lg bg-[#11F08E] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-black tracking-tighter text-white text-xl uppercase whitespace-nowrap">NextBot</span>
          </div>
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-[#11F08E] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all flex-shrink-0"
            title={sidebarCollapsed ? "Genişlet" : "Daralt"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className={cn("flex-1 space-y-1 mt-4", sidebarCollapsed ? "px-2" : "px-4")}>
          <div className={cn("px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2", sidebarCollapsed && "hidden")}>Dashboard</div>
          
          <div 
            onClick={() => setActiveView("queue")}
            className={cn(
              "flex items-center rounded-xl cursor-pointer transition-all",
              sidebarCollapsed ? "justify-center py-3 px-0" : "gap-3 px-4 py-3",
              activeView === "queue" 
                ? "bg-[#11F08E]/10 text-[#11F08E] border border-[#11F08E]/20" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span className={cn("text-sm font-bold whitespace-nowrap", sidebarCollapsed && "hidden")}>Yükleme Kuyruğu</span>
          </div>

          <div
            onClick={() => setActiveView("history")}
            className={cn(
              "flex items-center rounded-xl cursor-pointer transition-all",
              sidebarCollapsed ? "justify-center py-3 px-0" : "gap-3 px-4 py-3",
              activeView === "history"
                ? "bg-[#11F08E]/10 text-[#11F08E] border border-[#11F08E]/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span className={cn("text-sm font-bold whitespace-nowrap", sidebarCollapsed && "hidden")}>Yayın Geçmişi</span>
          </div>
          <div className={cn("mt-8 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2", sidebarCollapsed && "hidden")}>Ayarlar</div>
          <div
            onClick={() => setActiveView("catalog")}
            className={cn(
              "flex items-center rounded-xl cursor-pointer transition-all",
              sidebarCollapsed ? "justify-center py-3 px-0" : "gap-3 px-4 py-3",
              activeView === "catalog"
                ? "bg-[#11F08E]/10 text-[#11F08E] border border-[#11F08E]/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
            title="Katalog Yönetimi"
          >
            <Boxes className="w-4 h-4 flex-shrink-0" />
            <span className={cn("text-sm font-bold whitespace-nowrap", sidebarCollapsed && "hidden")}>Katalog</span>
          </div>
          <div
            onClick={() => setActiveView("settings")}
            className={cn(
              "flex items-center rounded-xl cursor-pointer transition-all",
              sidebarCollapsed ? "justify-center py-3 px-0" : "gap-3 px-4 py-3",
              activeView === "settings"
                ? "bg-[#11F08E]/10 text-[#11F08E] border border-[#11F08E]/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className={cn("text-sm font-bold whitespace-nowrap", sidebarCollapsed && "hidden")}>Bot Ayarları</span>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 hidden">
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Account Plan</p>
            <p className="text-white font-bold text-sm mb-2">Enterprise Pro</p>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#11F08E] w-3/4"></div>
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 italic">750 / 1000 listings used</p>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-h-0 bg-[#0d1117]">
        {/* Header */}
        <header className="h-14 lg:h-16 border-b border-white/5 flex items-center justify-between px-3 sm:px-4 lg:px-8 bg-[#0d1117]/50 backdrop-blur-md flex-shrink-0 z-20">
          {/* Sol: Breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-zinc-500 hidden sm:inline truncate">Bot</span>
            <svg className="w-3 h-3 text-zinc-600 hidden sm:inline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-xs font-bold text-zinc-100 truncate">
              {activeView === "queue"
                ? "Yükleme Kuyruğu"
                : activeView === "history"
                  ? "Yayın Geçmişi"
                  : activeView === "catalog"
                    ? "Katalog Yönetimi"
                    : "Bot Ayarları"}
            </span>
          </div>

          {/* Sağ: Aksiyonlar */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-shrink-0">
            {/* Sahibinden Durumu */}
            <SahibindenAuthStatus />

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Manuel Ekle */}
            <button
              onClick={() => {
                console.log("[UI] 🖱 Manuel İlan modalı açıldı");
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-[10px] px-2 sm:px-3 lg:px-4 py-2 border border-[#11F08E]/20 bg-[#11F08E]/10 text-[#11F08E] hover:bg-[#11F08E]/20 rounded-lg transition-all font-bold uppercase tracking-widest leading-none active:scale-95"
              title="Manuel Ekle"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Manuel</span>
              <span className="hidden lg:inline"> Ekle</span>
            </button>

            {/* Toplu Ekle */}
            <button
              onClick={() => {
                console.log("[UI] 🖱 Toplu İlan modalı açıldı");
                setIsBulkModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-[10px] px-2 sm:px-3 lg:px-4 py-2 border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-all font-bold uppercase tracking-widest leading-none active:scale-95"
              title="Toplu Ekle"
            >
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Toplu</span>
              <span className="hidden lg:inline"> Ekle</span>
            </button>

            {/* Sıfırla */}
            <button
              onClick={handleReset}
              className="text-[10px] px-2 sm:px-3 lg:px-4 py-2 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-all font-bold uppercase tracking-widest leading-none active:scale-95"
              title="Sıfırla"
            >
              <span className="sm:hidden">↺</span>
              <span className="hidden sm:inline">Sıfırla</span>
            </button>

            {/* Avatar */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-[#11F08E] shadow-lg flex-shrink-0">
              MB
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col relative min-h-0 hide-scrollbar">
          <style dangerouslySetInnerHTML={{
            __html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          {activeView === "queue" ? (
            <>
              {queueLoading ? (
                <>
                  {/* Skeleton Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 flex-shrink-0">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-sm animate-pulse">
                        <div className="h-3 w-16 bg-zinc-800 rounded mb-3" />
                        <div className="h-7 w-12 bg-zinc-800 rounded" />
                      </div>
                    ))}
                  </div>
                  {/* Skeleton Queue */}
                  <div className="flex-1 bg-[#0d1117] border border-white/5 lg:rounded-[24px] rounded-3xl shadow-2xl p-6 space-y-4 animate-pulse">
                    <div className="h-5 w-48 bg-zinc-800 rounded" />
                    <div className="h-12 bg-zinc-800/50 rounded-xl" />
                    <div className="h-12 bg-zinc-800/50 rounded-xl" />
                    <div className="h-12 bg-zinc-800/50 rounded-xl" />
                  </div>
                </>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 flex-shrink-0">
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kuyrukta</p>
                      <h4 className="text-2xl font-black text-white mt-2 tracking-tight">
                        {queueItems.filter((i) => i.status === "pending").length}
                      </h4>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tamamlanan</p>
                      <h4 className="text-2xl font-black text-[#11F08E] mt-2 tracking-tight">
                        {queueItems.filter((i) => i.status === "done").length}
                      </h4>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hatalı</p>
                      <h4 className="text-2xl font-black text-red-400 mt-2 tracking-tight">
                        {queueItems.filter((i) => i.status === "error").length}
                      </h4>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Durum</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          runInfo?.status === "paused_login" ? "bg-red-400" : queueRunning ? "bg-amber-400 animate-pulse" : "bg-zinc-600"
                        )} />
                        <h4 data-testid="run-status" className={cn(
                          "text-lg font-black tracking-tight",
                          runInfo?.status === "paused_login" ? "text-red-400" : queueRunning ? "text-amber-400" : "text-zinc-500"
                        )}>
                          {runInfo?.status === "paused_login"
                            ? "Giriş gerekli"
                            : runInfo?.status === "stopping"
                              ? "Duruyor…"
                              : queueRunning
                                ? "Aktif"
                                : "Beklemede"}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Sunucu kuyruk motoru bilgisi */}
                  {runInfo && (runInfo.status === "paused_login" || queueRunning || runInfo.stale) && (
                    <div
                      data-testid="run-banner"
                      className={cn(
                        "mb-6 flex-shrink-0 rounded-2xl border px-4 py-3 text-xs leading-relaxed",
                        runInfo.status === "paused_login"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-amber-400/20 bg-amber-400/5 text-amber-200"
                      )}
                    >
                      {runInfo.status === "paused_login" ? (
                        <p>
                          <b>Sahibinden oturumu kapalı — kuyruk duraklatıldı.</b> Tarayıcıda giriş yaptıktan sonra
                          “Devam Et”e basın. Bekleyen ilanlar korunuyor.
                        </p>
                      ) : queueRunning ? (
                        <>
                          <p>
                            <b>Kuyruk sunucuda çalışıyor</b>
                            {runInfo.ownedHere ? "" : runInfo.ownerLabel ? ` (${runInfo.ownerLabel})` : ""} — bu sekmeyi
                            kapatsanız da sürer.
                            {runInfo.currentTitle ? <> Şu an: <b>{runInfo.currentTitle}</b>.</> : null}{" "}
                            {runInfo.processed > 0 ? `İşlenen: ${runInfo.processed} (başarılı ${runInfo.success}, hatalı ${runInfo.failed}).` : ""}
                            {runInfo.status === "stopping" ? " Mevcut ilan bitince duracak." : ""}
                          </p>
                          {runLogs.length > 0 && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setShowRunLogs((v) => !v)}
                                className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80 hover:text-amber-200"
                              >
                                {showRunLogs ? "Adım loglarını gizle" : "Son adım logları"}
                              </button>
                              {showRunLogs && (
                                <pre data-testid="run-logs" className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-black/30 p-3 font-mono text-[10px] leading-snug text-zinc-400">
                                  {runLogs.slice(-25).join("\n")}
                                </pre>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p>
                          Kuyruğun önceki çalışması yarım kalmış görünüyor
                          {runInfo.heartbeatAgeSec != null ? ` (son sinyal ${runInfo.heartbeatAgeSec} sn önce)` : ""}.
                          “Devam Et”e basınca yarım kalan ilan yayın loguna bakılarak çözülür; yayınlanmış olabilecekler
                          tekrar yayınlanmaz.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Publish Queue Table */}
                  <PublishQueue
                    items={queueItems}
                    onRemove={removeFromQueue}
                    onUpdate={updateQueueItem}
                    onClear={handleReset}
                    onStartQueue={startQueue}
                    onStopQueue={stopQueue}
                    isRunning={queueRunning}
                    currentIndex={queueCurrentIndex}
                  />
                </>
              )}
            </>
          ) : activeView === "history" ? (
            <PublishHistory />
          ) : activeView === "catalog" ? (
            <CatalogManager />
          ) : (
            <BotSettings />
          )}

          <div className="h-32 lg:h-12 flex-shrink-0" /> {/* Spacer for mobile nav */}
        </div>
      </main>

      {/* ── Manual Listing Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[5%] bottom-[5%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#161c24] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <ManualListingForm
                  onCancel={() => setIsModalOpen(false)}
                  onDraftCreated={() => { }}
                  onAddToQueue={(draft, preview) => {
                    addToQueue(draft, preview);
                    setIsModalOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bulk Add Modal ── */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[10%] bottom-[10%] left-1/2 -translate-x-1/2 w-full max-w-3xl bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <BulkAddModal
                onClose={() => setIsBulkModalOpen(false)}
                onAdd={(newItems) => {
                  console.log(`[QUEUE] 📦 ${newItems.length} adet toplu ilan ekleniyor...`);
                  addItemsToQueue(newItems);
                  toast.success(`${newItems.length} adet ilan kuyruğa eklendi!`);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MobileNavigation
        activeTab={activeView}
        onTabChange={(tab) => setActiveView(tab)}
        onManualClick={() => setIsModalOpen(true)}
        onBulkClick={() => setIsBulkModalOpen(true)}
      />
      <SplashScreen />
    </div>
  );
}
