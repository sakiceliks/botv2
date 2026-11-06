import { NextResponse } from "next/server";

import { getQueueEngine } from "@/lib/queue-engine";

export const dynamic = "force-dynamic";

// Çalışma durumu + güncel öğe + son adım logları (telefon/masaüstü polling'i için hafif).
export async function GET() {
  try {
    const engine = await getQueueEngine();
    return NextResponse.json({ ok: true, ...(await engine.getStatus()) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Durum okunamadı." },
      { status: 500 },
    );
  }
}
