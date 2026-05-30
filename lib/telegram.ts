import { readSettings } from "@/lib/settings";

interface TelegramResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const settings = readSettings();
  const { telegramBotToken, telegramChatId } = settings;

  if (!telegramBotToken || !telegramChatId) {
    return { ok: false, error: "Telegram bot token veya chat ID ayarlanmamış." };
  }

  try {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as any).description || `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

export function formatQueueReport(
  successCount: number,
  errorCount: number,
  totalProcessed: number,
  batchNumber: number,
  errorDetails: string[],
): string {
  const timestamp = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const lines: string[] = [];

  lines.push(`<b>Kuyruk Raporu #${batchNumber}</b>`);
  lines.push(`<i>${timestamp}</i>`);
  lines.push("");
  lines.push(`Toplam: <b>${totalProcessed}</b> ilan`);
  lines.push(`Basarili: <b>${successCount}</b>`);
  lines.push(`Hatali: <b>${errorCount}</b>`);

  if (errorDetails.length > 0) {
    lines.push("");
    lines.push("<b>Hatalar:</b>");
    for (const detail of errorDetails.slice(0, 5)) {
      lines.push(`- ${detail}`);
    }
    if (errorDetails.length > 5) {
      lines.push(`... ve ${errorDetails.length - 5} hata daha`);
    }
  }

  return lines.join("\n");
}
