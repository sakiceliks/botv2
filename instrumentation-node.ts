// Açılış kurtarması: önceki süreç çöktüyse ya da kapandıysa "Yükleniyor" (running) kalmış kuyruk öğelerini
// yayın loguna bakarak çözer: loglu → done, son onay sonrası belirsiz → "kontrol et" (error), diğeri → pending.
// Hiçbir ilan otomatik yeniden yayınlanmaz ve kuyruk kendiliğinden başlamaz.
import { getQueueEngine } from "./lib/queue-engine";

(async () => {
  if (!process.env.MONGODB_URI) return;
  try {
    const engine = await getQueueEngine();
    const result = await engine.recoverOnBoot();
    if (result.skipped) {
      console.log("[QUEUE] Açılış kurtarması ertelendi: kuyruk başka bir örnekte çalışıyor görünüyor (bekçi lease bayatlayınca bakacak).");
    } else if (result.recovered.length > 0) {
      console.log(`[QUEUE] Açılış kurtarması: ${result.recovered.map((r) => `${r.title} → ${r.outcome}`).join("; ")}`);
    }
  } catch (error) {
    // Mongo erişilemiyorsa açılışı engelleme; ilk "Başlat"ta kurtarma yeniden yapılır.
    console.error("[QUEUE] Açılış kurtarması başarısız:", error instanceof Error ? error.message : error);
  }
})();
