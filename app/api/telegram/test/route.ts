import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, chatId } = await req.json();

    if (!token || !chatId) {
      return NextResponse.json({ ok: false, error: "Token ve Chat ID gerekli." });
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Sahibinden Bot baglantisi basarili!\nBildirimler aktif.",
        parse_mode: "HTML",
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description || "Telegram API hatasi" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" },
      { status: 500 },
    );
  }
}
