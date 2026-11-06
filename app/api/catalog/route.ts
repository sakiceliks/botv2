import { NextResponse } from "next/server";
import { catalogSchema } from "@/lib/catalog-types";
import { readCatalog, writeCatalog } from "@/lib/catalog-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = readCatalog();
    return NextResponse.json({ ok: true, catalog });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Okuma hatası" },
      { status: 500 },
    );
  }
}

// Toplu yazma — içe aktarma / çoklu düzenleme senaryoları için.
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = catalogSchema.safeParse(body?.catalog ?? body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz katalog" },
        { status: 400 },
      );
    }
    const catalog = writeCatalog(parsed.data);
    return NextResponse.json({ ok: true, catalog });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Yazma hatası" },
      { status: 500 },
    );
  }
}
