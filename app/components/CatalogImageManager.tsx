"use client";

// Model bazlı görsel upload + galeri: sürükle-bırak, çoklu yükleme,
// ilerleme çubuğu, renk atama ve toplu silme.
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Palette,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCatalog } from "@/hooks/use-catalog";

type ImageEntry = {
  filename: string;
  url: string;
  color?: string;
  colorSlug?: string;
  size: number;
  modifiedAt: number;
};

type UploadItem = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

const ACCEPT_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const CONCURRENCY = 3;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** XHR ile yükleme — fetch upload progress desteklemez. */
function uploadFile(
  modelSlug: string,
  color: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append("modelSlug", modelSlug);
    if (color) formData.append("color", color);
    formData.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/catalog/images");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: data.error || data.errors?.[0] || `HTTP ${xhr.status}` });
        }
      } catch {
        resolve({ ok: false, error: `HTTP ${xhr.status}` });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Bağlantı hatası" });
    xhr.send(formData);
  });
}

export function CatalogImageManager({ modelSlug }: { modelSlug: string }) {
  const { catalog, paletteNames, updateModel } = useCatalog();
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadColor, setUploadColor] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  // Kuyruğun tek kaynağı: ref (state render için ayna).
  const queueRef = useRef<UploadItem[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const uploadColorRef = useRef(uploadColor);
  uploadColorRef.current = uploadColor;

  const setQueue = useCallback((next: UploadItem[]) => {
    queueRef.current = next;
    setUploads(next);
  }, []);

  const patchUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    queueRef.current = queueRef.current.map((u) => (u.id === id ? { ...u, ...patch } : u));
    setUploads(queueRef.current);
  }, []);

  const loadImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/catalog/images?model=${encodeURIComponent(modelSlug)}`);
      const data = await res.json();
      if (data.ok) setImages(data.images ?? []);
    } catch {
      /* sessiz */
    } finally {
      setLoading(false);
    }
  }, [modelSlug]);

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    loadImages();
  }, [modelSlug, loadImages]);

  // Katalog mutationlarından sonra galeriyi tazele (renk folder taşımaları vb.)
  const catalogVersion = catalog ? catalog.colors.length + catalog.brands.length : 0;
  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogVersion]);

  const processQueue = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      while (true) {
        const queued = queueRef.current.filter((u) => u.status === "queued").slice(0, CONCURRENCY);
        if (queued.length === 0) break;

        await Promise.all(
          queued.map(async (item) => {
            patchUpload(item.id, { status: "uploading", progress: 0 });
            const result = await uploadFile(modelSlug, uploadColorRef.current, item.file, (pct) =>
              patchUpload(item.id, { progress: pct }),
            );
            patchUpload(item.id, {
              status: result.ok ? "done" : "error",
              progress: 100,
              error: result.error,
            });
          }),
        );
      }
      await loadImages();
    } finally {
      busyRef.current = false;
    }
  }, [modelSlug, patchUpload, loadImages]);

  const enqueueFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
      return ACCEPT_EXT.includes(ext);
    });
    const invalidCount = files.length - valid.length;
    if (invalidCount > 0) toast.warning(`${invalidCount} dosya desteklenmedi (jpg/png/webp/gif)`);
    if (valid.length === 0) return;

    const items: UploadItem[] = valid.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      status: "queued",
      progress: 0,
    }));
    setQueue([...queueRef.current, ...items]);
    void processQueue();
  };

  const clearFinished = () =>
    setQueue(queueRef.current.filter((u) => u.status === "queued" || u.status === "uploading"));

  const doneCount = uploads.filter((u) => u.status === "done").length;
  const failCount = uploads.filter((u) => u.status === "error").length;
  const activeCount = uploads.filter((u) => u.status === "queued" || u.status === "uploading").length;

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const imageKey = (img: ImageEntry) => `${img.colorSlug ?? ""}/${img.filename}`;

  const deleteImages = async (targets: ImageEntry[]) => {
    if (targets.length === 0) return;
    if (!window.confirm(`${targets.length} görsel kalıcı olarak silinsin mi?`)) return;
    try {
      const res = await fetch("/api/catalog/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSlug,
          items: targets.map((t) => ({ filename: t.filename, color: t.color })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${data.deleted} görsel silindi`);
        setSelected(new Set());
        await loadImages();
      } else {
        toast.error(data.error ?? "Silme başarısız");
      }
    } catch {
      toast.error("Bağlantı hatası");
    }
  };

  const recolorImage = async (img: ImageEntry, newColor: string) => {
    setMenuFor(null);
    try {
      const res = await fetch("/api/catalog/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSlug,
          filename: img.filename,
          fromColor: img.color ?? "",
          toColor: newColor,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(newColor ? `Görsel "${newColor}" rengine taşındı` : "Görsel renksiz yapıldı");
        await loadImages();
      } else {
        toast.error(data.error ?? "Taşıma başarısız");
      }
    } catch {
      toast.error("Bağlantı hatası");
    }
  };

  const assignColorToModel = async (color: string) => {
    if (!color) return;
    const found = catalog?.brands.flatMap((b) => b.models).find((m) => m.slug === modelSlug);
    if (!found) return;
    if (found.colors.includes(color)) return;
    const res = await updateModel(found.id, { colors: [...found.colors, color] });
    if (res.ok) toast.success(`"${color}"modele eklendi`);
    else toast.error(res.error ?? "Model güncellenemedi");
  };

  const allSelected = images.length > 0 && selected.size === images.length;

  return (
    <div className="space-y-4">
      {/* ── Upload alanı ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={uploadColor}
            onChange={(e) => setUploadColor(e.target.value)}
            className="appearance-none bg-[#0d1117] border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-200 outline-none focus:border-[#11F08E]/50 cursor-pointer"
          >
            <option value="">Renksiz (kök)</option>
            {paletteNames.map((c) => (
              <option key={c} value={c} className="bg-zinc-900">
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
        </div>
        <p className="text-[10px] text-zinc-600">
          Yüklenen görseller bu renk klasörüne gider — boş bırakırsanız kök havuza eklenir.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files);
          enqueueFiles(files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
          dragOver
            ? "border-[#11F08E] bg-[#11F08E]/5 scale-[1.01]"
            : "border-white/10 hover:border-[#11F08E]/40 hover:bg-white/[0.02]",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_EXT.join(",")}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            enqueueFiles(files);
            e.target.value = "";
          }}
        />
        <UploadCloud
          className={cn(
            "w-8 h-8 mx-auto mb-2 transition-colors",
            dragOver ? "text-[#11F08E]" : "text-zinc-600",
          )}
        />
        <p className="text-xs font-bold text-zinc-300">
          Görselleri buraya sürükle <span className="text-zinc-600">veya tıkla</span>
        </p>
        <p className="text-[10px] text-zinc-600 mt-1">JPG, PNG, WEBP, GIF • dosya başına maks 20MB</p>
      </div>

      {/* ── Upload kuyruğu ── */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {activeCount > 0 ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#11F08E]" />
                    Yükleniyor ({uploads.filter((u) => u.status === "done").length}/{uploads.length})
                  </>
                ) : (
                  <>
                    Tamamlandı: {doneCount} başarılı
                    {failCount > 0 && `, ${failCount} hatalı`}
                  </>
                )}
              </div>
              {activeCount === 0 && (
                <button
                  onClick={clearFinished}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Listeyi temizle
                </button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-white/[0.04]">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-zinc-300 truncate">{u.file.name}</p>
                    <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          u.status === "error"
                            ? "bg-red-500"
                            : u.status === "done"
                              ? "bg-[#11F08E]"
                              : "bg-[#11F08E]/70",
                        )}
                        initial={false}
                        animate={{ width: `${u.progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    {u.error && <p className="text-[10px] text-red-400 mt-0.5">{u.error}</p>}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
                    {u.status === "done" ? "✓" : u.status === "error" ? "✕" : `${u.progress}%`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Galeri toolbar ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {loading ? "Yükleniyor..." : `${images.length} görsel`}
          </span>
          {images.length > 0 && (
            <button
              onClick={() => setSelected(allSelected ? new Set() : new Set(images.map(imageKey)))}
              className="text-[10px] font-bold text-[#11F08E] hover:underline"
            >
              {allSelected ? "Seçimi bırak" : "Tümünü seç"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={() => deleteImages(images.filter((i) => selected.has(imageKey(i))))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Sil ({selected.size})
            </button>
          )}
          <button
            onClick={loadImages}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Galeri grid ── */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-white/[0.05] bg-white/[0.015]">
          <ImageIcon className="w-8 h-8 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-500">Bu modelin havuzunda henüz görsel yok</p>
          <p className="text-[10px] text-zinc-600 mt-1">Yukarıdan yükleyerek başlayın</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => {
            const key = imageKey(img);
            const isSelected = selected.has(key);
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "group relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer",
                  isSelected
                    ? "border-[#11F08E] ring-2 ring-[#11F08E]/30"
                    : "border-white/[0.06] hover:border-white/20",
                )}
                onClick={() => toggleSelect(key)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.filename}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                {/* seçim rozeti */}
                <div
                  className={cn(
                    "absolute top-1.5 left-1.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-[#11F08E] border-[#11F08E]"
                      : "bg-black/40 border-white/30 opacity-0 group-hover:opacity-100",
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                </div>

                {/* renk rozeti */}
                {img.color && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-[9px] font-bold text-zinc-200">
                    {img.color}
                  </span>
                )}

                {/* hover aksiyonları */}
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 to-transparent">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor(menuFor === key ? null : key);
                      }}
                      className="p-1.5 rounded-lg bg-black/50 backdrop-blur text-zinc-200 hover:text-[#11F08E] transition-colors"
                      title="Renk ata"
                    >
                      <Palette className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {menuFor === key && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full right-0 mb-1 z-30 w-40 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#161c24] shadow-2xl py-1"
                        >
                          <button
                            onClick={() => recolorImage(img, "")}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-400 hover:bg-white/5"
                          >
                            Renksiz (kök)
                          </button>
                          {paletteNames.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                recolorImage(img, color);
                                void assignColorToModel(color);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-200 hover:bg-white/5 flex items-center gap-2"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0"
                                style={{ background: catalog?.colors.find((c) => c.name === color)?.hex }}
                              />
                              {color}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImages([img]);
                    }}
                    className="p-1.5 rounded-lg bg-black/50 backdrop-blur text-zinc-200 hover:text-red-400 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* menü dışına tıklayınca kapat */}
      {menuFor !== null && (
        <button className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuFor(null)} aria-hidden />
      )}
    </div>
  );
}
