"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen,
  ChevronDown,
  Smartphone,
  Type,
  FileText,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Palette,
  HardDrive,
  Banknote,
  ListPlus
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BRANDS,
  SLOGANS,
  DEFAULT_DESCRIPTION,
  TOWNS,
  COLORS,
  STORAGE_CAPACITIES
} from "@/lib/manual-data";
import type { ListingDraft } from "@/lib/types";

interface ManualListingFormProps {
  onDraftCreated: (draft: ListingDraft) => void;
  onAddToQueue?: (draft: ListingDraft, preview: string | null) => void;
  onCancel?: () => void;
}

export function ManualListingForm({ onDraftCreated, onAddToQueue, onCancel }: ManualListingFormProps) {
  const [imagePath, setImagePath] = useState("");
  const [pathError, setPathError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isValidatingPath, setIsValidatingPath] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(BRANDS[0].name);
  const [selectedModel, setSelectedModel] = useState(BRANDS[0].models[0]);
  const [selectedSlogan, setSelectedSlogan] = useState(SLOGANS[1]);

  const [selectedTown, setSelectedTown] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("256 GB");
  const [selectedPrice, setSelectedPrice] = useState(() => {
    const raw = 52000 + Math.floor(Math.random() * 2001);
    return String(Math.round(raw / 10) * 10);
  });

  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);

  const validateAndPreview = async (p: string) => {
    setImagePath(p);
    setPathError(null);
    setPreview(null);

    if (!p.trim()) return;

    const ext = p.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      setPathError("Desteklenmeyen dosya uzantısı. (jpg, png, webp, gif)");
      return;
    }

    setIsValidatingPath(true);
    try {
      const res = await fetch("/api/upload-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: p.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setPreview(data.imageUrl);
        setPathError(null);
      } else {
        setPathError(data.error || "Dosya bulunamadı.");
      }
    } catch {
      setPathError("Bağlantı hatası.");
    } finally {
      setIsValidatingPath(false);
    }
  };

  const handleBrandChange = (brandName: string) => {
    setSelectedBrand(brandName);
    const brand = BRANDS.find((b) => b.name === brandName);
    if (brand && brand.models.length > 0) {
      setSelectedModel(brand.models[0]);
    }
  };

  const buildDraft = (imageUrl: string, imagePath: string): ListingDraft => {
    const nameParts = [selectedSlogan, selectedModel];
    if (selectedStorage) nameParts.push(selectedStorage);
    if (selectedColor) nameParts.push(selectedColor);
    const listingName = nameParts.join(" ").toUpperCase();

    return {
      _id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: listingName,
      slug: listingName.toLowerCase().replace(/\s+/g, "-"),
      brand: selectedBrand,
      model: selectedModel,
      series: selectedModel,
      product: selectedModel,
      productType: "Akıllı Telefon",
      vehicleType: selectedBrand,
      condition: "Sıfır",
      category: "Cep Telefonu",
      partCategory: selectedModel,
      price: Number(selectedPrice) || 45000,
      description: description || DEFAULT_DESCRIPTION,
      color: selectedColor || undefined,
      storage: selectedStorage || undefined,
      town: selectedTown || undefined,
      imageUrl,
      imagePath,
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
      sourceHints: ["Manuel Giriş"],
      warnings: [],
    };
  };

  const uploadImageAndRun = async (
    action: "create" | "queue"
  ) => {
    if (!imagePath.trim() || !preview) {
      toast.error("Lütfen geçerli bir görsel yolu girin.");
      return;
    }

    const price = Number(selectedPrice);
    if (!price || price < 1) {
      toast.error("Geçerli bir fiyat girin.");
      return;
    }

    if (!selectedTown) {
      toast.error("Lütfen bir ilçe seçin.");
      return;
    }

    if (action === "create") setIsUploading(true);
    else setIsAddingToQueue(true);

    try {
      const uploadRes = await fetch("/api/upload-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: imagePath.trim() }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.ok) throw new Error(uploadData.error || "Yükleme hatası");

      const { imageUrl, imagePath: savedPath } = uploadData;
      const draft = buildDraft(imageUrl, savedPath);

      if (action === "create") {
        onDraftCreated(draft);
        toast.success("İlan taslağı oluşturuldu!");
      } else {
        onAddToQueue?.(draft, imageUrl);
        toast.success("İlan kuyruğa eklendi!", {
          description: draft.name,
        });

        setImagePath("");
        setPreview(null);
        setSelectedStorage("256 GB");
        setSelectedColor("");
        setSelectedTown("");
        setSelectedPrice(String(Math.round((52000 + Math.floor(Math.random() * 2001)) / 10) * 10));

        if (onCancel) {
           setTimeout(onCancel, 500);
        }
      }
    } catch (error) {
      console.error("Manual upload error:", error);
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setIsUploading(false);
      setIsAddingToQueue(false);
    }
  };

  const handleSubmit = () => uploadImageAndRun("create");
  const handleAddToQueue = () => uploadImageAndRun("queue");

  const inputBase = "w-full rounded-xl border border-zinc-800 bg-[#0d1117] px-3 py-3 text-[16px] sm:text-sm text-zinc-200 outline-none focus:border-[#11F08E]/50 focus:ring-1 focus:ring-[#11F08E]/20 transition-all";
  const selectBase = "w-full rounded-xl border border-zinc-800 bg-[#0d1117] px-3 py-3 text-[16px] sm:text-sm text-zinc-200 outline-none appearance-none focus:border-[#11F08E]/50 focus:ring-1 focus:ring-[#11F08E]/20 transition-all cursor-pointer";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-h-[85vh] overflow-y-auto px-1 hide-scrollbar"
    >
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <div className="flex items-center justify-between sticky top-0 bg-[#161c24]/90 backdrop-blur-md z-10 py-2 -mx-1 px-1">
        <h2 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
          <Type className="text-[#11F08E]" />
          Manuel İlan
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors bg-white/[0.03] rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-5 rounded-[28px] border border-white/5 bg-[#161c24] p-5 sm:p-7 shadow-xl">

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> İlan Görseli
          </label>
          <div className="relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              onBlur={() => { if (imagePath.trim()) validateAndPreview(imagePath); }}
              onKeyDown={(e) => { if (e.key === "Enter") validateAndPreview(imagePath); }}
              placeholder="/path/to/image.jpg"
              className={cn(
                inputBase,
                "pl-10 pr-10 font-mono text-xs",
                pathError && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
              )}
            />
            {isValidatingPath && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#11F08E] animate-spin" />
            )}
            {!isValidatingPath && preview && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#11F08E]" />
            )}
          </div>
          {pathError && (
            <p className="text-[10px] text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {pathError}
            </p>
          )}
          {preview && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#11F08E]/30">
              <img src={preview} alt="Önizleme" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Smartphone className="w-3 h-3" /> Marka
            </label>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className={selectBase}
              >
                {BRANDS.map(brand => (
                  <option key={brand.name} value={brand.name} className="bg-zinc-900">{brand.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Smartphone className="w-3 h-3" /> Model
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={selectBase}
              >
                {BRANDS.find(b => b.name === selectedBrand)?.models.map(model => (
                  <option key={model} value={model} className="bg-zinc-900">{model}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> İlçe
            </label>
            <div className="relative">
              <select
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
                className={selectBase}
              >
                <option value="" className="bg-zinc-900">Seçiniz</option>
                {TOWNS.map(town => (
                  <option key={town} value={town} className="bg-zinc-900">{town}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Palette className="w-3 h-3" /> Renk
            </label>
            <div className="relative">
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className={selectBase}
              >
                <option value="" className="bg-zinc-900">Seçiniz</option>
                {COLORS.map(color => (
                  <option key={color} value={color} className="bg-zinc-900">{color}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Banknote className="w-3 h-3" /> Fiyat (TL)
            </label>
            <input
              type="number"
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              placeholder="45000"
              className={inputBase}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <HardDrive className="w-3 h-3" /> Depolama Kapasitesi
            </label>
            <div className="relative">
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className={selectBase}
              >
                <option value="" className="bg-zinc-900">Seçiniz</option>
                {STORAGE_CAPACITIES.map(storage => (
                  <option key={storage} value={storage} className="bg-zinc-900">{storage}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Type className="w-3 h-3" /> Başlık Sloganı
          </label>
          <div className="relative">
            <select
              value={selectedSlogan}
              onChange={(e) => setSelectedSlogan(e.target.value)}
              className={selectBase}
            >
              {SLOGANS.map(slogan => (
                <option key={slogan} value={slogan} className="bg-zinc-900">{slogan}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
          <p className="text-[11px] text-zinc-600 italic">
            Oluşturulacak Başlık: <span className="text-[#11F08E] font-bold">
              {[selectedSlogan, selectedModel, selectedStorage].filter(Boolean).join(" ").toUpperCase()}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <FileText className="w-3 h-3" /> Açıklama (Varsayılan)
          </label>
          <div className="relative overflow-hidden rounded-xl bg-[#0d1117] border border-zinc-800 focus-within:border-[#11F08E]/40 focus-within:ring-1 focus-within:ring-[#11F08E]/20 transition-all">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-28 px-3 py-3 text-[11px] text-zinc-300 bg-transparent resize-none outline-none"
              placeholder="İlan açıklamasını girin..."
            />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
          </div>
          <p className="text-[10px] text-zinc-600 italic">
            Varsayılan açıklamayı düzenleyebilir veya kendi açıklamanızı girebilirsiniz.
          </p>
        </div>

        {onAddToQueue && (
          <button
            onClick={handleAddToQueue}
            disabled={isUploading || isAddingToQueue || !preview}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all",
              isUploading || isAddingToQueue || !preview
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                : "bg-[#11F08E] text-[#0d1117] hover:bg-[#0fd880] active:scale-[0.98] shadow-[0_10px_30px_rgba(17,240,142,0.2)]"
            )}
          >
            {isAddingToQueue ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ekleniyor...
              </>
            ) : (
              <>
                <ListPlus className="w-5 h-5" />
                Kuyruğa Ekle
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-2 py-2">
        <AlertCircle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
        <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-tight">
          Manuel giriş sonrası fiyat ve detayları sonraki adımda düzenleyebilirsiniz.
        </p>
      </div>
    </motion.div>
  );
}
