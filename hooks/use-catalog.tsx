"use client";

// Katalog verisine tek noktadan erişim: cache + seriye alınmış mutasyonlar.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Catalog, CatalogBrand, CatalogModel } from "@/lib/catalog-types";
import { computeModelSlug, colorHexFor } from "@/lib/catalog-types";
import { toModelSlug as legacyToModelSlug } from "@/lib/manual-data";

export type ActionResult = { ok: boolean; error?: string };

type BrandPatch = { name?: string; slugPrefix?: string; active?: boolean; order?: number };
type ModelPatch = {
  name?: string;
  slug?: string;
  active?: boolean;
  colors?: string[];
  brandId?: string;
  order?: number;
  regenerateSlug?: boolean;
};

type CatalogContextValue = {
  catalog: Catalog | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;

  // Marka
  createBrand: (name: string, slugPrefix?: string) => Promise<ActionResult>;
  updateBrand: (id: string, patch: BrandPatch) => Promise<ActionResult>;
  deleteBrand: (id: string, force?: boolean) => Promise<ActionResult>;

  // Model
  createModel: (brandId: string, name: string, colors?: string[]) => Promise<ActionResult>;
  updateModel: (modelId: string, patch: ModelPatch) => Promise<ActionResult>;
  deleteModel: (modelId: string) => Promise<ActionResult>;

  // Renk paleti
  addColor: (name: string, hex?: string) => Promise<ActionResult>;
  renameColor: (name: string, newName: string, hex?: string) => Promise<ActionResult>;
  deleteColor: (name: string) => Promise<ActionResult>;

  // Türetilmiş
  brands: CatalogBrand[];
  activeBrands: CatalogBrand[];
  paletteNames: string[];
  getBrand: (id: string) => CatalogBrand | undefined;
  getModelsForBrand: (brandId: string) => CatalogModel[];
  findModelByName: (name?: string) => { brand: CatalogBrand; model: CatalogModel } | undefined;
  getColorsForModel: (modelName?: string) => string[];
  toModelSlug: (brand: string, model: string) => string;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return res.json();
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mutasyonlar seri çalışır — eşzamanlı yanıtların cache'i ezmesini önler.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api<{ ok: boolean; catalog: Catalog; error?: string }>("/api/catalog");
      if (data.ok) {
        setCatalog(data.catalog);
        setError(null);
      } else {
        setError(data.error ?? "Katalog yüklenemedi");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const mutate = useCallback(<T,>(
    fn: () => Promise<{ ok: boolean; catalog?: Catalog; error?: string }>,
  ): Promise<ActionResult> => {
    const run = queueRef.current.then(async () => {
      try {
        const data = await fn();
        if (data.ok && data.catalog) {
          setCatalog(data.catalog);
          return { ok: true } as ActionResult;
        }
        return { ok: false, error: data.error ?? "İşlem başarısız" } as ActionResult;
      } catch {
        return { ok: false, error: "Bağlantı hatası" } as ActionResult;
      }
    });
    queueRef.current = run.catch(() => {});
    return run;
  }, []);

  const createBrand = useCallback(
    (name: string, slugPrefix?: string) =>
      mutate(() =>
        api("/api/catalog/brands", { method: "POST", body: JSON.stringify({ name, slugPrefix }) }),
      ),
    [mutate],
  );

  const updateBrand = useCallback(
    (id: string, patch: BrandPatch) =>
      mutate(() =>
        api("/api/catalog/brands", { method: "PATCH", body: JSON.stringify({ id, ...patch }) }),
      ),
    [mutate],
  );

  const deleteBrand = useCallback(
    (id: string, force?: boolean) =>
      mutate(() =>
        api("/api/catalog/brands", { method: "DELETE", body: JSON.stringify({ id, force }) }),
      ),
    [mutate],
  );

  const createModel = useCallback(
    (brandId: string, name: string, colors?: string[]) =>
      mutate(() =>
        api("/api/catalog/models", { method: "POST", body: JSON.stringify({ brandId, name, colors }) }),
      ),
    [mutate],
  );

  const updateModel = useCallback(
    (modelId: string, patch: ModelPatch) =>
      mutate(() =>
        api("/api/catalog/models", { method: "PATCH", body: JSON.stringify({ id: modelId, ...patch }) }),
      ),
    [mutate],
  );

  const deleteModel = useCallback(
    (modelId: string) =>
      mutate(() => api("/api/catalog/models", { method: "DELETE", body: JSON.stringify({ id: modelId }) })),
    [mutate],
  );

  const addColor = useCallback(
    (name: string, hex?: string) =>
      mutate(() =>
        api("/api/catalog/colors", {
          method: "POST",
          body: JSON.stringify({ name, hex: hex ?? colorHexFor(name) }),
        }),
      ),
    [mutate],
  );

  const renameColor = useCallback(
    (name: string, newName: string, hex?: string) =>
      mutate(() =>
        api("/api/catalog/colors", { method: "PATCH", body: JSON.stringify({ name, newName, hex }) }),
      ),
    [mutate],
  );

  const deleteColor = useCallback(
    (name: string) =>
      mutate(() => api("/api/catalog/colors", { method: "DELETE", body: JSON.stringify({ name }) })),
    [mutate],
  );

  const brands = catalog?.brands ?? [];
  const activeBrands = useMemo(() => brands.filter((b) => b.active), [brands]);
  const paletteNames = useMemo(() => (catalog?.colors ?? []).map((c) => c.name), [catalog]);

  const getBrand = useCallback((id: string) => brands.find((b) => b.id === id), [brands]);

  const getModelsForBrand = useCallback(
    (brandId: string) => brands.find((b) => b.id === brandId)?.models ?? [],
    [brands],
  );

  const findModelByName = useCallback(
    (name?: string) => {
      if (!name) return undefined;
      const lower = name.toLocaleLowerCase("tr-TR");
      for (const brand of brands) {
        const model = brand.models.find((m) => m.name.toLocaleLowerCase("tr-TR") === lower);
        if (model) return { brand, model };
      }
      return undefined;
    },
    [brands],
  );

  const getColorsForModel = useCallback(
    (modelName?: string) => {
      const found = findModelByName(modelName);
      if (found && found.model.colors.length > 0) return found.model.colors;
      return paletteNames;
    },
    [findModelByName, paletteNames],
  );

  const toModelSlug = useCallback(
    (brand: string, model: string) => {
      const brandEntry = brands.find((b) => b.name.toLocaleLowerCase("tr-TR") === brand.toLocaleLowerCase("tr-TR"));
      if (brandEntry) {
        const modelEntry = brandEntry.models.find(
          (m) => m.name.toLocaleLowerCase("tr-TR") === model.toLocaleLowerCase("tr-TR"),
        );
        if (modelEntry) return modelEntry.slug;
        return computeModelSlug(brandEntry.slugPrefix, model);
      }
      // Katalogda olmayan marka/model → eski sabit mantık
      return legacyToModelSlug(brand, model);
    },
    [brands],
  );

  const value: CatalogContextValue = {
    catalog,
    loading,
    error,
    reload,
    createBrand,
    updateBrand,
    deleteBrand,
    createModel,
    updateModel,
    deleteModel,
    addColor,
    renameColor,
    deleteColor,
    brands,
    activeBrands,
    paletteNames,
    getBrand,
    getModelsForBrand,
    findModelByName,
    getColorsForModel,
    toModelSlug,
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog, CatalogProvider içinde kullanılmalıdır.");
  return ctx;
}
