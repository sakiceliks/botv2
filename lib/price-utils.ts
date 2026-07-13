// Client ve server'dan güvenle import edilebilir — node:fs bağımlılığı yok

export interface ModelPriceRange {
  min: number;
  max: number;
}

export function getPriceRangeForModel(
  ranges: Record<string, ModelPriceRange> | undefined,
  brand: string,
  model: string,
): ModelPriceRange {
  return ranges?.[`${brand}__${model}`] ?? { min: 48000, max: 50000 };
}

export function randomPrice(range: ModelPriceRange): number {
  const raw = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
  return Math.round(raw / 10) * 10;
}
