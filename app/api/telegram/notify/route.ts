import { NextResponse } from "next/server";

import { sendTelegramMessage, formatQueueReport } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { successCount, errorCount, totalProcessed, batchNumber, errorDetails } = await req.json();

    const message = formatQueueReport(
      successCount ?? 0,
      errorCount ?? 0,
      totalProcessed ?? 0,
      batchNumber ?? 1,
      errorDetails ?? [],
    );

    const result = await sendTelegramMessage(message);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" },
      { status: 500 },
    );
  }
}
