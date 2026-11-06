import { NextResponse } from "next/server";
import { z } from "zod";

import { runGuardedPublish } from "@/lib/publish-service";

const publishSchema = z.object({
  mode: z.enum(["draft", "publish"]),
  reviewedForPublish: z.boolean().optional(),
  queueId: z.string().optional(),
  attempt: z.number().optional(),
  draft: z.object({
    _id: z.string(),
    name: z.string(),
    slug: z.string(),
    brand: z.string(),
    model: z.string(),
    series: z.string(),
    product: z.string(),
    productType: z.string(),
    vehicleType: z.string(),
    condition: z.string(),
    category: z.string(),
    partCategory: z.string(),
    price: z.number(),
    description: z.string(),
    color: z.string().optional(),
    storage: z.string().optional(),
    origin: z.string().optional(),
    warranty: z.string().optional(),
    exchangeable: z.string().optional(),
    town: z.string().optional(),
    quarter: z.string().optional(),
    imageUrl: z.string(),
    imagePath: z.string(),
    inStock: z.boolean(),
    createdAt: z.string(),
    categoryPath: z.array(z.string()),
    confidence: z.number(),
    fieldConfidence: z.object({
      brand: z.number(),
      model: z.number(),
      vehicleType: z.number(),
      partCategory: z.number(),
      product: z.number()
    }),
    sourceHints: z.array(z.string()),
    warnings: z.array(z.string())
  })
});

// Tek seferlik/elle yayın. Kuyruk artık sunucudaki motorla (POST /api/queue/run) ilerler; mükerrer
// koruması ve yayın logu her iki yolda da lib/publish-service.ts içindeki ortak akıştan geçer.
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = publishSchema.parse(json);

    const result = await runGuardedPublish(payload);
    if (result.rejected) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 400 });
    }

    const { rejected: _rejected, status: _status, ...body } = result;
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Yayinlama sirasinda hata olustu."
      },
      { status: 500 }
    );
  }
}
