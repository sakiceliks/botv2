"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PublishLogEntry, PublishLogSummary } from "@/lib/publish-log";

type ListResponse = {
  ok: boolean;
  total: number;
  published: number;
  failed: number;
  entries: PublishLogSummary[];
  error?: string;
};

function statusOf(e: PublishLogSummary) {
  if (e.mode === "draft") return { label: "Taslak", cls: "text-zinc-400 bg-zinc-800/40 border-zinc-700/30", icon: FileText };
  if (e.ok) return { label: "Yayınlandı", cls: "text-[#11F08E] bg-[#11F08E]/8 border-[#11F08E]/20", icon: CheckCircle2 };
  if (e.submitted) return { label: "Gönderildi · kontrol et", cls: "text-amber-300 bg-amber-400/8 border-amber-400/25", icon: AlertTriangle };
  return { label: "Hata", cls: "text-red-400 bg-red-500/8 border-red-500/20", icon: AlertCircle };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function HistoryRow({ entry }: { entry: PublishLogSummary }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<PublishLogEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const status = statusOf(entry);
  const StatusIcon = status.icon;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      setLoading(true);
      try {
        const res = await fetch(`/api/publish-log?id=${encodeURIComponent(entry.id)}`);
        const data = await res.json();
        if (data.ok) setDetail(data.entry);
        else toast.error(data.error || "Log okunamadı");
      } catch {
        toast.error("Log okunamadı");
      } finally {
        setLoading(false);
      }
    }
  };

  const copyLogs = () => {
    if (!detail) return;
    navigator.clipboard
      .writeText([`${detail.title} (${formatDate(detail.createdAt)})`, ...detail.logs].join("\n"))
      .then(() => toast.success("Loglar kopyalandı"))
      .catch(() => toast.error("Kopyalanamadı"));
  };

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="w-full text-left grid grid-cols-1 lg:grid-cols-[20px_150px_minmax(200px,1fr)_110px_110px_170px_110px] gap-2 lg:gap-4 items-center px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="hidden lg:block text-zinc-500">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <span className="text-[11px] font-bold text-zinc-500 tabular-nums">{formatDate(entry.createdAt)}</span>
        <span className="min-w-0">
          <span className="block text-xs font-black text-zinc-100 truncate">{entry.title}</span>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate mt-0.5">
            {[entry.brand, entry.model, entry.storage, entry.color].filter(Boolean).join(" · ")}
          </span>
          {(entry.imageReused || (entry.attempt ?? 1) > 1) && (
            <span className="flex flex-wrap gap-1 mt-1">
              {entry.imageReused && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/25 text-[9px] font-bold text-amber-300">
                  <AlertTriangle className="w-2.5 h-2.5" /> Görsel tekrar kullanıldı
                </span>
              )}
              {(entry.attempt ?? 1) > 1 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/40 text-[9px] font-bold text-zinc-400">
                  {entry.attempt}. deneme
                </span>
              )}
            </span>
          )}
        </span>
        <span className="text-xs font-bold text-zinc-300 tabular-nums">{entry.price?.toLocaleString("tr-TR")} TL</span>
        <span className="text-xs text-zinc-400 truncate">{entry.town || "—"}</span>
        <span>
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider", status.cls)}>
            <StatusIcon className="w-3 h-3 flex-shrink-0" />
            {status.label}
          </span>
        </span>
        <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{entry.classifiedId ? `#${entry.classifiedId}` : "—"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 lg:pl-[52px]">
          {loading || !detail ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500 py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loglar yükleniyor...
            </div>
          ) : (
            <div className="space-y-3">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                {detail.error && (
                  <div className="sm:col-span-2 text-red-400"><span className="font-bold">Hata:</span> {detail.error}</div>
                )}
                {detail.originalTitle && detail.originalTitle !== detail.title && (
                  <div className="sm:col-span-2 text-zinc-400"><span className="font-bold text-zinc-500">Kuyruktaki başlık:</span> {detail.originalTitle}</div>
                )}
                <div className="text-zinc-400"><span className="font-bold text-zinc-500">Süre:</span> {detail.durationSec}s</div>
                <div className="text-zinc-400 truncate"><span className="font-bold text-zinc-500">Mahalle:</span> {detail.quarter || "—"}</div>
                <div className="text-zinc-400 truncate sm:col-span-2"><span className="font-bold text-zinc-500">Son URL:</span> {detail.finalUrl || "—"}</div>
                <div className="text-zinc-400 truncate sm:col-span-2"><span className="font-bold text-zinc-500">Görsel:</span> {detail.imagePath || "—"}</div>
                <div className="text-zinc-400 sm:col-span-2 whitespace-pre-line"><span className="font-bold text-zinc-500">Açıklama:</span> {detail.description}</div>
              </dl>
              <div className="relative">
                <button
                  type="button"
                  onClick={copyLogs}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Kopyala</span>
                </button>
                <pre className="max-h-96 overflow-auto rounded-xl bg-black/40 border border-white/5 p-3 pr-24 text-[11px] leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap break-words">
                  {detail.logs.length ? detail.logs.join("\n") : "(adım logu yok)"}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PublishHistory() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/publish-log?limit=500&q=${encodeURIComponent(q)}`);
      const json: ListResponse = await res.json();
      if (json.ok) setData(json);
      else toast.error(json.error || "Yayın geçmişi okunamadı");
    } catch {
      toast.error("Yayın geçmişi okunamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  const stats = [
    { label: "Toplam Deneme", value: data?.total ?? 0, cls: "text-zinc-100" },
    { label: "Yayınlandı", value: data?.published ?? 0, cls: "text-[#11F08E]" },
    { label: "Hatalı", value: data?.failed ?? 0, cls: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
            <p className={cn("text-2xl font-black mt-1 tabular-nums", s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Başlık, model, renk, ilçe veya ilan no ara..."
              className="w-full rounded-xl border border-zinc-800 bg-[#0d1117] pl-9 pr-3 py-2.5 text-[16px] lg:text-sm text-zinc-200 outline-none focus:border-[#11F08E]/50 focus:ring-1 focus:ring-[#11F08E]/20"
            />
          </div>
          <button
            type="button"
            onClick={() => load(query)}
            className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Yenile"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        <div className="hidden lg:grid grid-cols-[20px_150px_minmax(200px,1fr)_110px_110px_170px_110px] gap-4 px-4 py-2 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <span />
          <span>Tarih</span>
          <span>Başlık</span>
          <span>Fiyat</span>
          <span>İlçe</span>
          <span>Durum</span>
          <span>İlan No</span>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
          </div>
        ) : data && data.entries.length > 0 ? (
          data.entries.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
        ) : (
          <div className="py-16 text-center text-sm text-zinc-500">
            {query ? "Aramayla eşleşen kayıt yok." : "Henüz yayın kaydı yok. Kuyruktan yayınlanan her ilan burada kalıcı olarak tutulur."}
          </div>
        )}
      </div>

      <p className="text-[11px] text-zinc-600 italic">
        Kayıtlar <code className="text-zinc-500">data/publish-log/</code> klasöründe aylık dosyalarda ve MongoDB&apos;de yedekli tutulur; uygulamadan silinemez.
      </p>
    </div>
  );
}
