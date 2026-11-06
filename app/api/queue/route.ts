import { NextResponse } from "next/server";
import { z } from "zod";

import { addQueueItems, clearQueue, deleteQueueItem, listQueueItems, patchQueueItem } from "@/lib/queue-store";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown, status = 500) {
  const message =
    error instanceof z.ZodError
      ? `Geçersiz istek: ${error.issues[0]?.path.join(".") || "gövde"} — ${error.issues[0]?.message}`
      : error instanceof Error
        ? error.message
        : "Bilinmeyen hata";
  return NextResponse.json({ ok: false, error: message }, { status: error instanceof z.ZodError ? 400 : status });
}

const draftSchema = z.object({ name: z.string(), brand: z.string(), model: z.string() }).passthrough();

const addSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        draft: draftSchema,
        preview: z.string().nullish(),
        addedAt: z.string().optional(),
      }),
    )
    .min(1)
    .max(500),
});

const patchSchema = z.object({
  id: z.string().min(1),
  patch: z.object({
    draft: z.record(z.unknown()).optional(),
    preview: z.string().nullable().optional(),
  }),
});

const deleteSchema = z.union([
  z.object({ id: z.string().min(1) }),
  z.object({ clearAll: z.literal(true) }),
]);

// Kuyruğu listeler (eklenme sırasıyla).
export async function GET() {
  try {
    const items = await listQueueItems();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return errorResponse(error);
  }
}

// Öğe ekler. Var olan öğelere DOKUNMAZ (öğe bazlı; tüm kuyruk yazılmaz).
export async function POST(req: Request) {
  try {
    const { items } = addSchema.parse(await req.json());
    const added = await addQueueItems(items);
    return NextResponse.json({ ok: true, added });
  } catch (error) {
    return errorResponse(error);
  }
}

// Tek öğenin taslağını/önizlemesini günceller. Yayınlanan ya da yayınlanmış öğe düzenlenemez (409).
export async function PATCH(req: Request) {
  try {
    const { id, patch } = patchSchema.parse(await req.json());
    const outcome = await patchQueueItem(id, patch);
    if (outcome === "not_found") return NextResponse.json({ ok: false, error: "Öğe bulunamadı." }, { status: 404 });
    if (outcome === "locked") {
      return NextResponse.json(
        { ok: false, error: "Bu ilan şu an yayınlanıyor ya da yayınlandı; düzenlenemez." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

// Tek öğeyi ya da (clearAll) yayınlanmakta olan hariç tüm kuyruğu siler.
export async function DELETE(req: Request) {
  try {
    const body = deleteSchema.parse(await req.json());
    if ("clearAll" in body) {
      const result = await clearQueue();
      return NextResponse.json({ ok: true, ...result });
    }
    const outcome = await deleteQueueItem(body.id);
    if (outcome === "locked") {
      return NextResponse.json({ ok: false, error: "Bu ilan şu an yayınlanıyor; silinemez." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
