import { NextResponse } from "next/server";

import { getQueueEngine } from "@/lib/queue-engine";

export const dynamic = "force-dynamic";

// Durdurma isteği: mevcut ilan BİTTİKTEN sonra kuyruk durur (yayın ortasında kesilmez).
export async function POST() {
  try {
    const engine = await getQueueEngine();
    return NextResponse.json(await engine.stop());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kuyruk durdurulamadı." },
      { status: 500 },
    );
  }
}
