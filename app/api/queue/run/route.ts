import { NextResponse } from "next/server";

import { getQueueEngine } from "@/lib/queue-engine";

export const dynamic = "force-dynamic";

// Kuyruğu SUNUCUDA başlatır (ya da "giriş gerekli" duraklamasından devam ettirir). Yanıt hemen döner;
// ilerleme için GET /api/queue/status kullanılır.
export async function POST() {
  try {
    const engine = await getQueueEngine();
    const result = await engine.start();
    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Kuyruk başlatılamadı." },
      { status: 500 },
    );
  }
}
