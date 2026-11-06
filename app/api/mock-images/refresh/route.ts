import { NextResponse } from "next/server";

import { refreshMockImagePools } from "@/lib/mock-image-refresh";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // ?models=slug1,slug2 — boşsa tüm havuzlar yenilenir.
    const raw = searchParams.get("models") ?? searchParams.get("model");
    const models = (raw ? raw.split(",") : [])
      .map((m) => m.trim())
      .filter((m) => /^[a-z0-9-]+(\/[a-z0-9-]+)?$/i.test(m))
      .slice(0, 12);

    const result = await refreshMockImagePools(models);
    return NextResponse.json(result, { status: result.ok || result.skipped ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
