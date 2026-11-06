"use client";

// Marka / Model / Renk katalog yönetimi — anında kaydeden CRUD paneli.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Copy,
  Eye,
  EyeOff,
  FolderOpen,
  Image as ImageIcon,
  ListPlus,
  Loader2,
  Package,
  Pencil,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCatalog, type ActionResult } from "@/hooks/use-catalog";
import { colorHexFor, computeModelSlug } from "@/lib/catalog-types";
import type { CatalogModel } from "@/lib/catalog-types";
import { CatalogImageManager } from "./CatalogImageManager";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

const panelCls = "rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col min-h-0";
const inputCls =
  "w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#11F08E]/50 transition-colors placeholder:text-zinc-600";

export function CatalogManager() {
  const {
    catalog,
    loading,
    error,
    reload,
    brands,
    paletteNames,
    createBrand,
    updateBrand,
    deleteBrand,
    createModel,
    updateModel,
    deleteModel,
    addColor,
    renameColor,
    deleteColor,
  } = useCatalog();

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [imageCounts, setImageCounts] = useState<Record<string, number>>({});
  const [mobileStep, setMobileStep] = useState<"brands" | "models" | "detail">("brands");
  const [renamingBrandId, setRenamingBrandId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? null;
  const selectedModel = selectedBrand?.models.find((m) => m.id === selectedModelId) ?? null;

  // Katalog yüklenince ilk markayı seç
  useEffect(() => {
    if (!selectedBrandId && brands.length > 0) {
      setSelectedBrandId(brands[0].id);
    }
    if (selectedBrandId && !brands.some((b) => b.id === selectedBrandId)) {
      setSelectedBrandId(brands[0]?.id ?? null);
      setSelectedModelId(null);
    }
  }, [brands, selectedBrandId]);

  // Görsel sayaçlarını yükle
  const loadCounts = async () => {
    try {
      const res = await fetch("/api/catalog/images");
      const data = await res.json();
      if (data.ok) setImageCounts(data.counts ?? {});
    } catch {
      /* sessiz */
    }
  };
  useEffect(() => {
    loadCounts();
  }, [catalog?.brands.length]);

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLocaleLowerCase("tr-TR");
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLocaleLowerCase("tr-TR").includes(q) ||
        b.models.some((m) => m.name.toLocaleLowerCase("tr-TR").includes(q)),
    );
  }, [brands, brandSearch]);

  const filteredModels = useMemo(() => {
    if (!selectedBrand) return [];
    const q = modelSearch.trim().toLocaleLowerCase("tr-TR");
    if (!q) return selectedBrand.models;
    return selectedBrand.models.filter((m) => m.name.toLocaleLowerCase("tr-TR").includes(q));
  }, [selectedBrand, modelSearch]);

  const totalModels = brands.reduce((acc, b) => acc + b.models.length, 0);
  const totalImages = Object.values(imageCounts).reduce((a, b) => a + b, 0);

  const run = async (fn: () => Promise<ActionResult>, successMsg?: string) => {
    setActionBusy(true);
    try {
      const result = await fn();
      if (result.ok) {
        if (successMsg) toast.success(successMsg);
        loadCounts();
        return true;
      }
      toast.error(result.error ?? "İşlem başarısız");
      return false;
    } finally {
      setActionBusy(false);
    }
  };

  // ── Marka aksiyonları ──────────────────────────────────────────────────────
  const handleAddBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    const ok = await run(() => createBrand(name), `"${name}" markası eklendi`);
    if (ok) {
      setNewBrandName("");
      setShowAddBrand(false);
    }
  };

  const commitBrandRename = async (id: string) => {
    const name = renameValue.trim();
    setRenamingBrandId(null);
    if (!name) return;
    await run(() => updateBrand(id, { name }), "Marka yeniden adlandırıldı");
  };

  const handleDeleteBrand = (id: string) => {
    const brand = brands.find((b) => b.id === id);
    if (!brand) return;
    setConfirm({
      title: `"${brand.name}" silinsin mi?`,
      description:
        brand.models.length > 0
          ? `Bu marka altında ${brand.models.length} model var. Silerseniz tüm modeller de kaldırılır (görsel klasörleri diskte kalır).`
          : "Marka katalogdan kaldırılacak.",
      confirmLabel: "Sil",
      onConfirm: async () => {
        let result = await deleteBrand(id, false);
        if (!result.ok && result.error === "has_models") {
          if (!window.confirm("Marka altında modeller var. Yine de (modelleriyle birlikte) silmek istiyor musunuz?"))
            return;
          result = await deleteBrand(id, true);
        }
        if (result.ok) {
          toast.success("Marka silindi");
          if (selectedBrandId === id) {
            setSelectedBrandId(brands.find((b) => b.id !== id)?.id ?? null);
            setSelectedModelId(null);
          }
          loadCounts();
        } else {
          toast.error(result.error ?? "Silme başarısız");
        }
      },
    });
  };

  const moveBrand = (id: string, dir: -1 | 1) => {
    const idx = brands.findIndex((b) => b.id === id);
    if (idx < 0) return;
    void updateBrand(id, { order: idx + dir });
  };

  // ── Model aksiyonları ──────────────────────────────────────────────────────
  const handleAddModel = async () => {
    const name = newModelName.trim();
    if (!name || !selectedBrand) return;
    const ok = await run(() => createModel(selectedBrand.id, name), `"${name}" modeli eklendi`);
    if (ok) {
      setNewModelName("");
      setShowAddModel(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedBrand) return;
    const names = bulkText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setBulkBusy(true);
    let added = 0;
    let failed = 0;
    for (const name of names) {
      const result = await createModel(selectedBrand.id, name);
      if (result.ok) added++;
      else failed++;
    }
    setBulkBusy(false);
    setBulkText("");
    setShowBulkAdd(false);
    loadCounts();
    if (added > 0) toast.success(`${added} model eklendi${failed ? ` (${failed} başarısız)` : ""}`);
    else toast.error("Hiçbir model eklenemedi");
  };

  const commitModelRename = async (model: CatalogModel) => {
    const name = renameValue.trim();
    setRenamingBrandId(null);
    if (!name || name === model.name) return;
    await run(() => updateModel(model.id, { name }), "Model yeniden adlandırıldı (slug korundu)");
  };

  const handleDeleteModel = (model: CatalogModel) => {
    setConfirm({
      title: `"${model.name}" silinsin mi?`,
      description: `Model katalogdan kaldırılacak.${imageCounts[model.slug] ? ` Bu modele ait ${imageCounts[model.slug]} görsel diskte kalır.` : ""}`,
      confirmLabel: "Sil",
      onConfirm: async () => {
        const result = await deleteModel(model.id);
        if (result.ok) {
          toast.success("Model silindi");
          if (selectedModelId === model.id) setSelectedModelId(null);
          loadCounts();
        } else {
          toast.error(result.error ?? "Silme başarısız");
        }
      },
    });
  };

  const moveModel = (model: CatalogModel, dir: -1 | 1) => {
    if (!selectedBrand) return;
    const idx = selectedBrand.models.findIndex((m) => m.id === model.id);
    if (idx < 0) return;
    void updateModel(model.id, { order: idx + dir });
  };

  if (loading && !catalog) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#11F08E] animate-spin" />
      </div>
    );
  }

  if (error && !catalog) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-sm text-zinc-400">{error}</p>
        <button onClick={reload} className="text-xs font-bold text-[#11F08E] hover:underline">
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* ── Başlık + istatistikler ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#11F08E]" />
            Katalog Yönetimi
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Marka, model ve renkleri düzenleyin — değişiklikler anında kaydedilir
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <StatBadge label="Marka" value={brands.length} />
          <StatBadge label="Model" value={totalModels} />
          <StatBadge label="Renk" value={paletteNames.length} accent />
          <StatBadge label="Görsel" value={totalImages} />
        </div>
      </div>

      {/* ── 3 sütun / mobil adımlar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_280px_1fr] gap-3 items-start">
        {/* Marka paneli */}
        <section
          className={cn(panelCls, "max-h-[calc(100dvh-14rem)]", mobileStep !== "brands" && "hidden lg:flex")}
        >
          <PanelHeader
            title="Markalar"
            subtitle={`${filteredBrands.length} marka`}
            action={
              <button
                onClick={() => setShowAddBrand((p) => !p)}
                className="p-1 rounded-lg text-zinc-500 hover:text-[#11F08E] hover:bg-[#11F08E]/10 transition-colors"
                title="Marka ekle"
              >
                <Plus className="w-4 h-4" />
              </button>
            }
          />
          <div className="px-3 py-2 border-b border-white/[0.04]">
            <SearchBox value={brandSearch} onChange={setBrandSearch} placeholder="Marka veya model ara..." />
          </div>

          <AnimatePresence>
            {showAddBrand && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/[0.04]"
              >
                <div className="p-3 space-y-2">
                  <input
                    autoFocus
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
                    placeholder="Marka adı (örn. General Mobile)"
                    className={inputCls}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBrand}
                      disabled={actionBusy || !newBrandName.trim()}
                      className="flex-1 py-1.5 rounded-lg bg-[#11F08E] text-[#0d1117] text-xs font-black uppercase tracking-widest disabled:opacity-40"
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => setShowAddBrand(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto py-1.5 min-h-0">
            {filteredBrands.length === 0 && (
              <p className="text-[11px] text-zinc-600 italic px-4 py-6 text-center">Marka bulunamadı</p>
            )}
            {filteredBrands.map((brand) => {
              const active = brand.id === selectedBrandId;
              return (
                <div
                  key={brand.id}
                  className={cn(
                    "group relative flex items-center gap-1.5 px-3 py-2.5 cursor-pointer transition-colors",
                    active ? "bg-[#11F08E]/10" : "hover:bg-white/[0.03]",
                  )}
                  onClick={() => {
                    setSelectedBrandId(brand.id);
                    setSelectedModelId(null);
                    setMobileStep("models");
                  }}
                >
                  {active && <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[#11F08E]" />}
                  {renamingBrandId === brand.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitBrandRename(brand.id);
                        if (e.key === "Escape") setRenamingBrandId(null);
                      }}
                      onBlur={() => commitBrandRename(brand.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-[#0d1117] border border-[#11F08E]/40 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    />
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-bold truncate", active ? "text-[#11F08E]" : "text-zinc-200")}>
                          {brand.name}
                          {!brand.active && <span className="ml-1 text-[9px] text-zinc-600">(pasif)</span>}
                        </p>
                        <p className="text-[9px] text-zinc-600 font-mono truncate">{brand.slugPrefix}*</p>
                      </div>
                      <span className="text-[9px] font-black text-zinc-600 tabular-nums flex-shrink-0">
                        {brand.models.length}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                        <RowIconBtn title="Yukarı" onClick={(e) => { e.stopPropagation(); moveBrand(brand.id, -1); }}>
                          <ArrowRight className="w-3 h-3 rotate-[-90deg]" />
                        </RowIconBtn>
                        <RowIconBtn title="Aşağı" onClick={(e) => { e.stopPropagation(); moveBrand(brand.id, 1); }}>
                          <ArrowRight className="w-3 h-3 rotate-90" />
                        </RowIconBtn>
                        <RowIconBtn
                          title="Yeniden adlandır"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingBrandId(brand.id);
                            setRenameValue(brand.name);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </RowIconBtn>
                        <RowIconBtn
                          title={brand.active ? "Pasifleştir" : "Aktifleştir"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void updateBrand(brand.id, { active: !brand.active });
                          }}
                        >
                          {brand.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
                        </RowIconBtn>
                        <RowIconBtn title="Sil" danger onClick={(e) => { e.stopPropagation(); handleDeleteBrand(brand.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </RowIconBtn>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Model paneli */}
        <section
          className={cn(panelCls, "max-h-[calc(100dvh-14rem)]", mobileStep !== "models" && "hidden lg:flex")}
        >
          <PanelHeader
            title={selectedBrand ? selectedBrand.name : "Modeller"}
            subtitle={selectedBrand ? `${selectedBrand.models.length} model` : undefined}
            action={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowBulkAdd((p) => !p)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  title="Toplu model ekle"
                >
                  <ListPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowAddModel((p) => !p)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-[#11F08E] hover:bg-[#11F08E]/10 transition-colors"
                  title="Model ekle"
                  disabled={!selectedBrand}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            }
            onBack={() => setMobileStep("brands")}
          />
          <div className="px-3 py-2 border-b border-white/[0.04]">
            <SearchBox value={modelSearch} onChange={setModelSearch} placeholder="Model ara..." />
          </div>

          <AnimatePresence>
            {showAddModel && selectedBrand && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/[0.04]"
              >
                <div className="p-3 space-y-2">
                  <input
                    autoFocus
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
                    placeholder="Model adı (örn. 16e)"
                    className={inputCls}
                  />
                  {newModelName.trim() && (
                    <p className="text-[10px] text-zinc-600 font-mono">
                      klasör: {computeModelSlug(selectedBrand.slugPrefix, newModelName.trim())}/
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddModel}
                      disabled={actionBusy || !newModelName.trim()}
                      className="flex-1 py-1.5 rounded-lg bg-[#11F08E] text-[#0d1117] text-xs font-black uppercase tracking-widest disabled:opacity-40"
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => setShowAddModel(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {showBulkAdd && selectedBrand && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/[0.04]"
              >
                <div className="p-3 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    Toplu model ekle (her satıra bir model)
                  </p>
                  <textarea
                    autoFocus
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={5}
                    placeholder={"16e\n15 Plus\nGalaxy A56"}
                    className={cn(inputCls, "resize-none font-mono text-xs")}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkAdd}
                      disabled={bulkBusy || !bulkText.trim()}
                      className="flex-1 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {bulkBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                      {bulkBusy ? "Ekleniyor..." : "Ekle"}
                    </button>
                    <button
                      onClick={() => setShowBulkAdd(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto py-1.5 min-h-0">
            {!selectedBrand && (
              <p className="text-[11px] text-zinc-600 italic px-4 py-6 text-center">Önce bir marka seçin</p>
            )}
            {selectedBrand && filteredModels.length === 0 && (
              <p className="text-[11px] text-zinc-600 italic px-4 py-6 text-center">Model bulunamadı</p>
            )}
            {filteredModels.map((model) => {
              const active = model.id === selectedModelId;
              const count = imageCounts[model.slug] ?? 0;
              return (
                <div
                  key={model.id}
                  className={cn(
                    "group relative flex items-center gap-1.5 px-3 py-2.5 cursor-pointer transition-colors",
                    active ? "bg-[#11F08E]/10" : "hover:bg-white/[0.03]",
                  )}
                  onClick={() => {
                    setSelectedModelId(model.id);
                    setMobileStep("detail");
                  }}
                >
                  {active && <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[#11F08E]" />}
                  {renamingBrandId === model.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitModelRename(model);
                        if (e.key === "Escape") setRenamingBrandId(null);
                      }}
                      onBlur={() => commitModelRename(model)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-[#0d1117] border border-[#11F08E]/40 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    />
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-bold truncate", active ? "text-[#11F08E]" : "text-zinc-200")}>
                          {model.name}
                          {!model.active && <span className="ml-1 text-[9px] text-zinc-600">(pasif)</span>}
                        </p>
                        <p className="text-[9px] text-zinc-600 font-mono truncate">{model.slug}/</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {model.colors.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-zinc-600">
                            <Palette className="w-2.5 h-2.5" />
                            {model.colors.length}
                          </span>
                        )}
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-[9px] font-bold",
                            count > 0 ? "text-zinc-400" : "text-zinc-700",
                          )}
                        >
                          <ImageIcon className="w-2.5 h-2.5" />
                          {count}
                        </span>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                        <RowIconBtn title="Yukarı" onClick={(e) => { e.stopPropagation(); moveModel(model, -1); }}>
                          <ArrowRight className="w-3 h-3 rotate-[-90deg]" />
                        </RowIconBtn>
                        <RowIconBtn title="Aşağı" onClick={(e) => { e.stopPropagation(); moveModel(model, 1); }}>
                          <ArrowRight className="w-3 h-3 rotate-90" />
                        </RowIconBtn>
                        <RowIconBtn
                          title="Yeniden adlandır"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingBrandId(model.id);
                            setRenameValue(model.name);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </RowIconBtn>
                        <RowIconBtn
                          title={model.active ? "Pasifleştir" : "Aktifleştir"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void updateModel(model.id, { active: !model.active });
                          }}
                        >
                          {model.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
                        </RowIconBtn>
                        <RowIconBtn title="Sil" danger onClick={(e) => { e.stopPropagation(); handleDeleteModel(model); }}>
                          <Trash2 className="w-3 h-3" />
                        </RowIconBtn>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Detay paneli */}
        <section
          className={cn(panelCls, mobileStep !== "detail" && "hidden lg:flex")}
        >
          {selectedModel && selectedBrand ? (
            <ModelDetail
              key={selectedModel.id}
              model={selectedModel}
              brand={selectedBrand}
              imageCount={imageCounts[selectedModel.slug] ?? 0}
              onBack={() => setMobileStep("models")}
              onUpdate={updateModel}
              onDelete={handleDeleteModel}
              addColor={addColor}
              renameColor={renameColor}
              deleteColor={deleteColor}
              palette={catalog?.colors ?? []}
              actionBusy={actionBusy}
              run={run}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Package className="w-10 h-10 text-zinc-700" />
              <p className="text-xs text-zinc-500">Detay için bir model seçin</p>
            </div>
          )}
        </section>
      </div>

      {/* ── Onay modalı ── */}
      <AnimatePresence>
        {confirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirm(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-[#161c24] border border-white/10 rounded-3xl shadow-2xl z-50 p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{confirm.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{confirm.description}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirm(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold"
                >
                  Vazgeç
                </button>
                <button
                  onClick={async () => {
                    const fn = confirm.onConfirm;
                    setConfirm(null);
                    await fn();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-black"
                >
                  {confirm.confirmLabel ?? "Sil"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Model detay paneli ───────────────────────────────────────────────────────

function ModelDetail({
  model,
  brand,
  imageCount,
  onBack,
  onUpdate,
  onDelete,
  addColor,
  renameColor,
  deleteColor,
  palette,
  actionBusy,
  run,
}: {
  model: CatalogModel;
  brand: { id: string; name: string; slugPrefix: string };
  imageCount: number;
  onBack: () => void;
  onUpdate: (id: string, patch: any) => Promise<ActionResult>;
  onDelete: (model: CatalogModel) => void;
  addColor: (name: string, hex?: string) => Promise<ActionResult>;
  renameColor: (name: string, newName: string, hex?: string) => Promise<ActionResult>;
  deleteColor: (name: string) => Promise<ActionResult>;
  palette: { name: string; hex: string }[];
  actionBusy: boolean;
  run: (fn: () => Promise<ActionResult>, msg?: string) => Promise<boolean>;
}) {
  const [nameDraft, setNameDraft] = useState(model.name);
  const [slugDraft, setSlugDraft] = useState(model.slug);
  const [addColorName, setAddColorName] = useState("");
  const [addColorHex, setAddColorHex] = useState("#38bdf8");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [newPaletteHex, setNewPaletteHex] = useState("#38bdf8");
  const [renamingColor, setRenamingColor] = useState<string | null>(null);
  const [renameColorValue, setRenameColorValue] = useState("");

  const availableColors = palette.filter((c) => !model.colors.includes(c.name));

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name || name === model.name) return;
    await run(() => onUpdate(model.id, { name }), "Model adı güncellendi");
  };

  const saveSlug = async () => {
    const slug = slugDraft.trim().toLowerCase();
    if (!slug || slug === model.slug) return;
    await run(() => onUpdate(model.id, { slug }), "Klasör slug'ı güncellendi");
  };

  const regenerateSlug = async () => {
    const next = computeModelSlug(brand.slugPrefix, model.name);
    setSlugDraft(next);
    await run(() => onUpdate(model.id, { regenerateSlug: true }), `Slug yeniden üretildi: ${next}`);
  };

  const removeColor = async (color: string) => {
    await run(
      () => onUpdate(model.id, { colors: model.colors.filter((c) => c !== color) }),
      `"${color}" modelden kaldırıldı`,
    );
  };

  const assignColor = async (color: string) => {
    if (!color) return;
    await run(() => onUpdate(model.id, { colors: [...model.colors, color] }), `"${color}" modele eklendi`);
  };

  const handleAddNewColor = async () => {
    const name = addColorName.trim();
    if (!name) return;
    const ok = await run(() => addColor(name, colorHexFor(name) === addColorHex ? undefined : addColorHex));
    if (!ok) return;
    await run(() => onUpdate(model.id, { colors: [...model.colors, name] }), `"${name}" rengi eklendi ve modele atandı`);
    setAddColorName("");
  };

  const handleAddPaletteColor = async () => {
    const name = newPaletteName.trim();
    if (!name) return;
    const ok = await run(() => addColor(name, newPaletteHex), `"${name}" palete eklendi`);
    if (ok) setNewPaletteName("");
  };

  const handlePaletteRename = async (oldName: string) => {
    const newName = renameColorValue.trim();
    setRenamingColor(null);
    if (!newName || newName === oldName) return;
    await run(() => renameColor(oldName, newName), "Renk yeniden adlandırıldı");
  };

  const handlePaletteDelete = (name: string) => {
    setConfirmLike({
      title: `"${name}" rengi silinsin mi?`,
      description: "Renk global paletten ve tüm modellerin renk listesinden kaldırılır. Görsel klasörleri etkilenmez.",
      onConfirm: async () => {
        await run(() => deleteColor(name), "Renk silindi");
      },
    });
  };

  // Basit onay (palette delete) — window.confirm yerine modal yerine kısa toast onayı
  const setConfirmLike = (opts: { title: string; description: string; onConfirm: () => void | Promise<void> }) => {
    if (window.confirm(`${opts.title}\n\n${opts.description}`)) {
      void opts.onConfirm();
    }
  };

  return (
    <div className="flex flex-col min-h-0 max-h-[calc(100dvh-10rem)]">
      <PanelHeader
        title={model.name}
        subtitle={`${brand.name} • ${imageCount} görsel`}
        onBack={onBack}
        action={
          <div className="flex items-center gap-1">
            <button
              onClick={() => void onUpdate(model.id, { active: !model.active })}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-bold transition-colors border",
                model.active
                  ? "border-[#11F08E]/30 bg-[#11F08E]/10 text-[#11F08E]"
                  : "border-white/10 bg-white/5 text-zinc-500",
              )}
            >
              {model.active ? "Aktif" : "Pasif"}
            </button>
            <RowIconBtn title="Sil" danger onClick={() => onDelete(model)}>
              <Trash2 className="w-3.5 h-3.5" />
            </RowIconBtn>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
        {/* Ad + Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Model Adı</FieldLabel>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className={inputCls}
            />
          </div>
          <div>
            <FieldLabel hint="Görsel klasörünün adı — slug'ı elle değiştirmezseniz yeniden adlandırmada korunur">
              Klasör Slug'ı
            </FieldLabel>
            <div className="flex gap-1.5">
              <input
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                onBlur={saveSlug}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className={cn(inputCls, "font-mono text-xs")}
              />
              <button
                onClick={() => navigator.clipboard?.writeText(`${model.slug}/`)}
                className="px-2 rounded-xl border border-white/10 text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                title="Kopyala"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={regenerateSlug}
                className="px-2 rounded-xl border border-white/10 text-zinc-500 hover:text-[#11F08E] transition-colors flex-shrink-0"
                title="Adadan yeniden üret"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Model renkleri */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel hint="Bu model için ilanlarda seçilebilir renkler">Model Renkleri</FieldLabel>
            <span className="text-[10px] font-black text-zinc-600">{model.colors.length}</span>
          </div>

          {model.colors.length === 0 ? (
            <p className="text-[11px] text-zinc-600 italic">
              Henüz renk atanmadı — model tüm global paleti kullanır.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {model.colors.map((color) => (
                <motion.span
                  key={color}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-zinc-200"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                    style={{ background: palette.find((c) => c.name === color)?.hex ?? colorHexFor(color) }}
                  />
                  {color}
                  <button
                    onClick={() => removeColor(color)}
                    className="p-0.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="relative">
              <select
                value=""
                onChange={(e) => assignColor(e.target.value)}
                disabled={availableColors.length === 0}
                className="appearance-none bg-[#0d1117] border border-white/10 rounded-xl pl-3 pr-8 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-[#11F08E]/50 cursor-pointer disabled:opacity-40"
              >
                <option value="">
                  {availableColors.length === 0 ? "Tüm renkler eklendi" : "Paletten ekle..."}
                </option>
                {availableColors.map((c) => (
                  <option key={c.name} value={c.name} className="bg-zinc-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
              <input
                value={addColorName}
                onChange={(e) => setAddColorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNewColor()}
                placeholder="Yeni renk adı..."
                className="flex-1 min-w-0 bg-[#0d1117] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#11F08E]/50 placeholder:text-zinc-600"
              />
              <input
                type="color"
                value={addColorHex}
                onChange={(e) => setAddColorHex(e.target.value)}
                className="w-7 h-7 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0.5"
                title="Renk seç"
              />
              <button
                onClick={handleAddNewColor}
                disabled={actionBusy || !addColorName.trim()}
                className="px-2.5 py-1.5 rounded-xl bg-[#11F08E]/10 border border-[#11F08E]/20 text-[#11F08E] text-[10px] font-black uppercase tracking-wider disabled:opacity-40"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Global palet */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <button
            onClick={() => setPaletteOpen((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-[#11F08E]" />
              <span className="text-xs font-bold text-white">Global Renk Paleti</span>
              <span className="text-[10px] text-zinc-600">({palette.length})</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-500">{paletteOpen ? "Kapat" : "Yönet"}</span>
          </button>
          <AnimatePresence initial={false}>
            {paletteOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/[0.04]"
              >
                <div className="p-3 space-y-1 max-h-56 overflow-y-auto">
                  {palette.map((color) => (
                    <div key={color.name} className="flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-white/[0.03] group">
                      <span
                        className="w-4 h-4 rounded-md border border-white/20 flex-shrink-0"
                        style={{ background: color.hex }}
                      />
                      {renamingColor === color.name ? (
                        <input
                          autoFocus
                          value={renameColorValue}
                          onChange={(e) => setRenameColorValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handlePaletteRename(color.name);
                            if (e.key === "Escape") setRenamingColor(null);
                          }}
                          onBlur={() => handlePaletteRename(color.name)}
                          className="flex-1 min-w-0 bg-[#0d1117] border border-[#11F08E]/40 rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                        />
                      ) : (
                        <>
                          <span className="flex-1 text-[11px] font-bold text-zinc-300 truncate">{color.name}</span>
                          <span className="text-[9px] font-mono text-zinc-600">{color.hex}</span>
                          <div className="hidden group-hover:flex items-center gap-0.5">
                            <RowIconBtn
                              title="Yeniden adlandır"
                              onClick={() => {
                                setRenamingColor(color.name);
                                setRenameColorValue(color.name);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </RowIconBtn>
                            <RowIconBtn title="Sil" danger onClick={() => handlePaletteDelete(color.name)}>
                              <Trash2 className="w-3 h-3" />
                            </RowIconBtn>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 p-3 border-t border-white/[0.04]">
                  <input
                    value={newPaletteName}
                    onChange={(e) => setNewPaletteName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPaletteColor()}
                    placeholder="Yeni palet rengi..."
                    className="flex-1 min-w-0 bg-[#0d1117] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#11F08E]/50 placeholder:text-zinc-600"
                  />
                  <input
                    type="color"
                    value={newPaletteHex}
                    onChange={(e) => setNewPaletteHex(e.target.value)}
                    className="w-7 h-7 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0.5"
                  />
                  <button
                    onClick={handleAddPaletteColor}
                    disabled={actionBusy || !newPaletteName.trim()}
                    className="px-2.5 py-1.5 rounded-xl bg-[#11F08E]/10 border border-[#11F08E]/20 text-[#11F08E] text-[10px] font-black uppercase tracking-wider disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Görseller */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-3.5 h-3.5 text-[#11F08E]" />
            <span className="text-xs font-bold text-white">Görsel Havuzu</span>
            <span className="text-[10px] text-zinc-600 font-mono">mock-image/{model.slug}/</span>
          </div>
          <CatalogImageManager modelSlug={model.slug} />
        </div>
      </div>
    </div>
  );
}

// ── Küçük yardımcı bileşenler ────────────────────────────────────────────────

function StatBadge({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="px-2.5 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center min-w-[54px]">
      <p className={cn("text-sm font-black tabular-nums", accent ? "text-[#11F08E]" : "text-white")}>{value}</p>
      <p className="text-[8px] text-zinc-600 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-1 -ml-1 rounded-lg text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <p className="text-xs font-black text-white uppercase tracking-wider truncate">{title}</p>
          {subtitle && <p className="text-[9px] text-zinc-600 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-1 flex-shrink-0">{action}</div>}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0d1117] border border-white/[0.06] rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-[#11F08E]/40 transition-colors placeholder:text-zinc-700"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function RowIconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "p-1 rounded-md text-zinc-600 transition-colors",
        danger ? "hover:text-red-400 hover:bg-red-500/10" : "hover:text-zinc-200 hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{children}</span>
      {hint && <p className="text-[9px] text-zinc-700 mt-0.5 leading-snug">{hint}</p>}
    </div>
  );
}
