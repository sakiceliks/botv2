import { NextResponse } from "next/server";

import { getPublishLogEntry, listPublishLog } from "@/lib/publish-log";

// Sadece okuma — yayın logu uygulamadan silinemez.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const entry = await getPublishLogEntry(id);
      if (!entry) return NextResponse.json({ ok: false, error: "Kayıt bulunamadı." }, { status: 404 });
      return NextResponse.json({ ok: true, entry });
    }

    const limit = Math.min(Number(searchParams.get("limit")) || 300, 2000);
    const q = searchParams.get("q") ?? "";
    return NextResponse.json({ ok: true, ...(await listPublishLog({ limit, q })) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Yayın logu okunamadı." },
      { status: 500 },
    );
  }
}
