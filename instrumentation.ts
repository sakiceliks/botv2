// Next.js sunucu açılış kancası (sunucu süreci başlarken bir kez çalışır).
// Node'a özgü kod ayrı dosyada tutulur; Edge derlemesi puppeteer-core gibi Node modüllerini çözemez.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
