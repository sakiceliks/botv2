"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Layers,
  ChevronDown,
  Type,
  Smartphone,
  Palette,
  PlusCircle,
  Zap,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TOWNS,
  DEFAULT_DESCRIPTION,
  getSlogansFor,
  getUniqueSlogansForCount,
  buildListingTitle,
  getStorageForModel,
} from "@/lib/manual-data";
import { useCatalog } from "@/hooks/use-catalog";
import type { ListingDraft } from "@/lib/types";
import { getPriceRangeForModel } from "@/lib/price-utils";
import type { BotSettings } from "@/lib/settings";

interface BulkAddModalProps {
  onAdd: (drafts: { draft: ListingDraft; preview: string | null }[]) => void;
  onClose: () => void;
}

export function BulkAddModal({ onAdd, onClose }: BulkAddModalProps) {
  const { activeBrands, getColorsForModel, toModelSlug } = useCatalog();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedSlogan, setSelectedSlogan] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("Sıfır");
  const [selectedColor, setSelectedColor] = useState("");
  const [quickAdding, setQuickAdding] = useState(false);
  const [quickProgress, setQuickProgress] = useState({ current: 0, total: 0 });
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [priceMin, setPriceMin] = useState(48000);
  const [priceMax, setPriceMax] = useState(50000);

  // Katalog yüklenince ilk aktif marka/modeli seç
  useEffect(() => {
    if (activeBrands.length === 0) return;
    const brandEntry = activeBrands.find((b) => b.name === selectedBrand);
    if (!brandEntry) {
      const first = activeBrands[0];
      setSelectedBrand(first.name);
      setSelectedModel(first.models.find((m) => m.active)?.name ?? first.models[0]?.name ?? "");
      return;
    }
    if (selectedModel && !brandEntry.models.some((m) => m.name === selectedModel)) {
      setSelectedModel(brandEntry.models.find((m) => m.active)?.name ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrands]);

  const modelStorage = getStorageForModel(selectedModel);

  // Settings'ten fiyat aralığını yükle
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { ok: boolean; settings: BotSettings }) => {
        if (data.ok) {
          setSelectedCondition(data.settings.defaultCondition || "Sıfır");
          const range = getPriceRangeForModel(data.settings.modelPriceRanges, selectedBrand, selectedModel);
          setPriceMin(range.min);
          setPriceMax(range.max);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marka veya model değişince fiyat aralığını güncelle
  const updatePriceRange = (brand: string, model: string) => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { ok: boolean; settings: BotSettings }) => {
        if (data.ok) {
          const range = getPriceRangeForModel(data.settings.modelPriceRanges, brand, model);
          setPriceMin(range.min);
          setPriceMax(range.max);
        }
      })
      .catch(() => {});
  };

  const handleBrandChange = (brandName: string) => {
    setSelectedBrand(brandName);
    const brand = activeBrands.find((b) => b.name === brandName);
    const firstModel = brand?.models.find((m) => m.active)?.name ?? brand?.models[0]?.name ?? selectedModel;
    if (brand && brand.models.length > 0) setSelectedModel(firstModel);
    updatePriceRange(brandName, firstModel);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    updatePriceRange(selectedBrand, model);
  };

  // Marka/model değişince havuz yeniden hesaplanır; seçili slogan havuzda yoksa sıfırlanır.
  const sloganPool = useMemo(
    () => getSlogansFor(selectedBrand, selectedModel),
    [selectedBrand, selectedModel]
  );

  useEffect(() => {
    setSelectedSlogan((prev) => (sloganPool.includes(prev) ? prev : sloganPool[0] ?? ""));
  }, [sloganPool]);

  type MockImage = { filename: string; url: string; color?: string };

  const fetchModelMockImages = async (brand: string, model: string): Promise<MockImage[]> => {
    const modelSlug = toModelSlug(brand, model);
    const res = await fetch(`/api/mock-images?model=${encodeURIComponent(modelSlug)}`);
    const data = await res.json();
    if (!data.ok || data.images.length === 0) return [];
    return [...data.images].sort(() => Math.random() - 0.5);
  };

  const uploadMockImage = async (image: MockImage, attempts = 3): Promise<{ imageUrl: string; imagePath: string } | null> => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        // Görsel telefona indirilip geri yüklenmez: sunucu mock-image/ klasöründen uploads/ altına kopyalar
        const copyRes = await fetch("/api/mock-images/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: image.url }),
        });
        const copyData = await copyRes.json();
        if (!copyData.ok) throw new Error(copyData.error || "Görsel kopyalanamadı");
        return { imageUrl: copyData.imageUrl, imagePath: copyData.imagePath };
      } catch {
        if (attempt === attempts) return null;
      }
    }
    return null;
  };

  const handleBulkAdd = async () => {
    setBulkAdding(true);
    try {
      const images = await fetchModelMockImages(selectedBrand, selectedModel);
      if (images.length === 0) {
        toast.error("Mock görsel bulunamadı!");
        setBulkAdding(false);
        return;
      }

      const total = 10;
      setBulkProgress({ current: 0, total });
      const newDrafts: { draft: ListingDraft; preview: string | null }[] = [];
      const uploadedCache = new Map<number, { imageUrl: string; imagePath: string }>();
      const uniqueSlogans = getUniqueSlogansForCount(sloganPool, total, selectedSlogan);
      let missingImageCount = 0;

      for (let i = 0; i < total; i++) {
        const imgIndex = i % images.length;
        let uploaded = uploadedCache.get(imgIndex);
        if (!uploaded) {
          const result = await uploadMockImage(images[imgIndex]);
          if (result) {
            uploaded = result;
            uploadedCache.set(imgIndex, result);
          } else {
            missingImageCount++;
          }
        }

        const currentTown = TOWNS[i % TOWNS.length];
        const currentStorage = getStorageForModel(selectedModel);

        const rawPrice = priceMin + Math.floor(Math.random() * (priceMax - priceMin + 1));
        const price = Math.round(rawPrice / 10) * 10;

        const slogan = uniqueSlogans[i] ?? `${selectedSlogan || sloganPool[0] || "SIFIR"} ${i + 1}`;
        const listingName = buildListingTitle(slogan, selectedModel, currentStorage, undefined, selectedCondition);

        const draft: ListingDraft = {
          _id: `bulk_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
          name: listingName,
          slug: listingName.toLowerCase().replace(/\s+/g, "-"),
          brand: selectedBrand,
          model: selectedModel,
          series: selectedModel,
          product: selectedModel,
          productType: "Akıllı Telefon",
          vehicleType: selectedBrand,
          condition: selectedCondition || "Sıfır",
          category: "Cep Telefonu",
          partCategory: selectedModel,
          price,
          description: DEFAULT_DESCRIPTION,
          color: images[imgIndex]?.color ?? (selectedColor || undefined),
          storage: currentStorage,
          town: currentTown,
          imageUrl: uploaded?.imageUrl ?? "",
          imagePath: uploaded?.imagePath ?? "",
          inStock: true,
          createdAt: new Date().toISOString(),
          categoryPath: ["İkinci El ve Sıfır Alışveriş", "Cep Telefonu", "Modeller", selectedBrand, selectedModel],
          confidence: 1.0,
          fieldConfidence: {
            brand: 1.0,
            model: 1.0,
            vehicleType: 1.0,
            partCategory: 1.0,
            product: 1.0,
          },
          sourceHints: ["Toplu Ekleme"],
          warnings: [],
        };

        newDrafts.push({ draft, preview: uploaded?.imageUrl ?? null });
        setBulkProgress({ current: i + 1, total });
      }

      onAdd(newDrafts);
      onClose();
      toast.success(
        missingImageCount > 0
          ? `${newDrafts.length} adet ilan kuyruğa eklendi! (${missingImageCount} tanesine görsel eklenemedi)`
          : `${newDrafts.length} adet ilan kuyruğa eklendi!`
      );
    } catch {
      toast.error("İlanlar eklenirken hata oluştu!");
    } finally {
      setBulkAdding(false);
    }
  };

  const handleQuickAdd = async () => {
    setQuickAdding(true);
    try {
      const shuffled = await fetchModelMockImages(selectedBrand, selectedModel);

      if (shuffled.length === 0) {
        toast.error("Mock görsel bulunamadı!");
        setQuickAdding(false);
        return;
      }

      const total = shuffled.length;
      setQuickProgress({ current: 0, total });
      const newDrafts: { draft: ListingDraft; preview: string | null }[] = [];
      const uniqueSlogans = getUniqueSlogansForCount(sloganPool, total, selectedSlogan);
      let successCount = 0;

      for (let i = 0; i < total; i++) {
        const uploaded = await uploadMockImage(shuffled[i]);

        if (!uploaded) {
          setQuickProgress({ current: i + 1, total });
          continue;
        }

        const currentTown = TOWNS[i % TOWNS.length];
        const currentStorage = getStorageForModel(selectedModel);

        const rawPrice = priceMin + Math.floor(Math.random() * (priceMax - priceMin + 1));
        const price = Math.round(rawPrice / 10) * 10;

        const slogan = uniqueSlogans[i] ?? `${selectedSlogan || sloganPool[0] || "SIFIR"} ${i + 1}`;
        const listingName = buildListingTitle(slogan, selectedModel, currentStorage, undefined, selectedCondition);

        const draft: ListingDraft = {
          _id: `quick_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
          name: listingName,
          slug: listingName.toLowerCase().replace(/\s+/g, "-"),
          brand: selectedBrand,
          model: selectedModel,
          series: selectedModel,
          product: selectedModel,
          productType: "Akıllı Telefon",
          vehicleType: selectedBrand,
          condition: selectedCondition || "Sıfır",
          category: "Cep Telefonu",
          partCategory: selectedModel,
          price,
          description: DEFAULT_DESCRIPTION,
          color: shuffled[i]?.color ?? (selectedColor || undefined),
          storage: currentStorage,
          town: currentTown,
          imageUrl: uploaded.imageUrl,
          imagePath: uploaded.imagePath,
          inStock: true,
          createdAt: new Date().toISOString(),
          categoryPath: ["İkinci El ve Sıfır Alışveriş", "Cep Telefonu", "Modeller", selectedBrand, selectedModel],
          confidence: 1.0,
          fieldConfidence: {
            brand: 1.0,
            model: 1.0,
            vehicleType: 1.0,
            partCategory: 1.0,
            product: 1.0,
          },
          sourceHints: ["Hızlı Ekleme"],
          warnings: [],
        };

        newDrafts.push({ draft, preview: uploaded.imageUrl });
        successCount++;
        setQuickProgress({ current: i + 1, total });
      }

      if (newDrafts.length === 0) {
        toast.error("Hiçbir ilan eklenemedi!");
        setQuickAdding(false);
        return;
      }

      onAdd(newDrafts);
      onClose();
      const failedCount = total - successCount;
      toast.success(
        failedCount > 0
          ? `${successCount} adet hızlı ilan kuyruğa eklendi! (${failedCount} görsel yüklenemedi)`
          : `${successCount} adet hızlı ilan kuyruğa eklendi!`
      );
    } catch (err) {
      toast.error("Hızlı ilan eklenirken hata oluştu!");
      setQuickAdding(false);
    }
  };

  const selectBase = "w-full rounded-xl border border-zinc-800 bg-[#0d1117] px-4 py-3.5 text-sm text-zinc-200 outline-none appearance-none focus:border-[#11F08E]/50 focus:ring-1 focus:ring-[#11F08E]/20 transition-all cursor-pointer";

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#11F08E]/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#11F08E]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Toplu İlan Ekle</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Tek tıkla 10 adet taslak oluştur</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Başlık Sloganı
            </label>
            <div className="relative">
              <select
                value={selectedSlogan}
                onChange={(e) => setSelectedSlogan(e.target.value)}
                className={selectBase}
              >
                {sloganPool.map(s => (
                  <option key={s} value={s} className="bg-zinc-900">{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" /> Durum
            </label>
            <div className="relative">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className={selectBase}
              >
                <option value="Sıfır" className="bg-zinc-900">Sıfır</option>
                <option value="İkinci El" className="bg-zinc-900">İkinci El</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" /> Marka
            </label>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className={selectBase}
              >
                {activeBrands.map(b => (
                  <option key={b.name} value={b.name} className="bg-zinc-900">{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" /> Model
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className={selectBase}
              >
                {activeBrands.find(b => b.name === selectedBrand)?.models.filter(m => m.active).map(m => (
                  <option key={m.name} value={m.name} className="bg-zinc-900">{m.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Renk
            </label>
            <div className="relative">
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className={selectBase}
              >
                <option value="" className="bg-zinc-900">Seçiniz</option>
                {getColorsForModel(selectedModel).map(color => (
                  <option key={color} value={color} className="bg-zinc-900">{color}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fiyat Aralığı */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Min Fiyat (TL)
            </label>
            <input
              type="number"
              value={priceMin}
              min={0}
              step={1000}
              onChange={(e) => setPriceMin(Number(e.target.value))}
              className={selectBase}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Max Fiyat (TL)
            </label>
            <input
              type="number"
              value={priceMax}
              min={0}
              step={1000}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className={selectBase}
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Önizleme & Bilgi</h4>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-400">
              Oluşturulacak Başlık:{" "}
              <span className="text-[#11F08E] font-bold">
                {buildListingTitle(selectedSlogan, selectedModel, modelStorage, undefined, selectedCondition)}
              </span>
            </p>
            <p className="text-xs text-zinc-400">
              Durum: <span className="text-white font-bold">{selectedCondition || "Sıfır"}</span>
            </p>
            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              Fiyat aralığı: <span className="text-white font-bold">{priceMin.toLocaleString("tr-TR")} — {priceMax.toLocaleString("tr-TR")} TL</span>. İlçeler alfabetik sırayla otomatik atanır.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-white/[0.01] space-y-3">
        <button
          onClick={handleBulkAdd}
          disabled={bulkAdding || quickAdding || !selectedBrand || !selectedModel}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#11F08E] text-[#0d1117] hover:bg-[#0fd880] active:scale-[0.98] transition-all font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(17,240,142,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulkAdding ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <PlusCircle className="w-5 h-5" />
          )}
          {bulkAdding
            ? `${bulkProgress.current} / ${bulkProgress.total} Yükleniyor...`
            : "Kuyruğa 10 Adet Ekle"}
        </button>
        <button
          onClick={handleQuickAdd}
          disabled={quickAdding || bulkAdding || !selectedBrand || !selectedModel}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] transition-all font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(139,92,246,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {quickAdding ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {quickAdding
            ? `${quickProgress.current} / ${quickProgress.total} Yükleniyor...`
            : "Hızlı İlan Ekle"}
        </button>
      </div>
    </div>
  );
}
