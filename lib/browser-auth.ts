import puppeteer, { type Browser, type Page } from "puppeteer-core";

import { readBrowserSession } from "@/lib/browser";

export type BrowserAuthStatus =
  | "logged-in"
  | "logged-out"
  | "browser-closed"
  | "unknown";

export type BrowserAuthResult = {
  ok: boolean;
  status: BrowserAuthStatus;
  browserRunning: boolean;
  currentUrl?: string;
  storeName?: string;
  message: string;
  logs: string[];
};

function addLog(logs: string[], message: string) {
  logs.push(
    `[${new Date().toLocaleTimeString("tr-TR", { hour12: false })}] ${message}`,
  );
}

async function connectToExistingBrowser(logs: string[]) {
  const session = await readBrowserSession();
  if (!session) {
    addLog(logs, "Kayitli browser session bulunamadi.");
    return null;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:${session.port}/json/version`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      addLog(
        logs,
        `Browser session endpointine ulasilamadi: ${response.status}`,
      );
      return null;
    }

    const json = (await response.json()) as { webSocketDebuggerUrl?: string };
    if (!json.webSocketDebuggerUrl) {
      addLog(logs, "webSocketDebuggerUrl bulunamadi.");
      return null;
    }

    addLog(logs, `Mevcut Chrome oturumuna baglaniliyor (${session.port}).`);
    return puppeteer.connect({
      browserWSEndpoint: json.webSocketDebuggerUrl,
      defaultViewport: null,
    });
  } catch (error) {
    addLog(
      logs,
      `Chrome baglantisi basarisiz: ${error instanceof Error ? error.message : "unknown"}`,
    );
    return null;
  }
}

export async function detectSahibindenAuthStatus(): Promise<BrowserAuthResult> {
  const logs: string[] = [];
  let browser: Browser | null = null;
  let page: Page | null = null;
  let isNewPage = false;

  try {
    // Add connection timeout
    const connectPromise = connectToExistingBrowser(logs);
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Chrome bağlantı zaman aşımı (15s)")), 15000)
    );
    
    browser = (await Promise.race([connectPromise, timeoutPromise])) as Browser | null;

    if (!browser) {
      return {
        ok: true,
        status: "browser-closed",
        browserRunning: false,
        message: "Tarayici oturumu acik degil. Once tarayiciyi acman gerekiyor.",
        logs,
      };
    }

    const pages = await browser.pages();
    const existingPage = pages.find((p) => p.url().includes("sahibinden.com"));

    if (existingPage) {
      page = existingPage;
      addLog(logs, `Mevcut bir Sahibinden sekmesi bulundu: ${page.url()}`);
    } else {
      addLog(logs, "Açık Sahibinden sekmesi bulunamadı. Otomatik sekme açılmayacak.");
      return {
        ok: true,
        status: "logged-out",
        browserRunning: true,
        message: "Sahibinden sekmesi açık değil.",
        logs,
      };
    }

    const currentUrl = page.url();
    const title = await page.title();
    
    const detection = await page.evaluate(() => {
      const normalize = (v?: string) => v?.toLocaleLowerCase("tr-TR").trim() || "";
      const text = normalize(document.body?.innerText?.slice(0, 3000));

      const hasLogoutLink = !!document.querySelector('a[href*="/cikis"], a[href*="/logout"]');
      const hasAccountLink = !!document.querySelector('a[href*="/hesabim"], a[href*="/bana-ozel"], .user-menu, #user-name');
      const hasMemberProfile = !!document.querySelector('.member-profile, .user-login-container');

      const storeNameEl = document.querySelector('#user-name, .user-name, .member-name, .username, [class*="user-name"], [class*="username"]');
      const storeName = storeNameEl?.textContent?.trim() || '';

      return {
        text,
        hasLogoutLink,
        hasAccountLink,
        hasMemberProfile,
        storeName,
      };
    });

    addLog(logs, `Kontrol URL: ${currentUrl}`);
    addLog(logs, `Sayfa basligi: ${title || "(bos)"}`);

    const normalizedText = detection.text;
    let parsedPath = "/";
    try { parsedPath = new URL(currentUrl).pathname; } catch {}

    const isLoginPage =
      parsedPath === "/" ||
      parsedPath.includes("/giris") ||
      parsedPath.includes("/login");

    const looksLoggedIn =
      (currentUrl.includes("banaozel.sahibinden.com") ||
        currentUrl.includes("sahibinden.com")) &&
      (detection.hasLogoutLink ||
        detection.hasAccountLink ||
        detection.hasMemberProfile ||
        normalizedText.includes("bana özel") ||
        normalizedText.includes("çıkış yap") ||
        normalizedText.includes("hesabım") ||
        normalizedText.includes("ilanlarım"));

    const looksLoggedOut =
      isLoginPage ||
      normalizedText.includes("giriş yap") ||
      normalizedText.includes("uye girisi") ||
      (normalizedText.includes("e-posta") && normalizedText.includes("şifre"));

    if (looksLoggedIn) {
      addLog(logs, "Sahibinden oturumu aktif gorunuyor (indicator bulundu).");
      if (detection.storeName) {
        addLog(logs, `Mağaza adı: ${detection.storeName}`);
      }
      return {
        ok: true,
        status: "logged-in",
        browserRunning: true,
        currentUrl,
        storeName: detection.storeName || undefined,
        message: "Sahibinden oturumu acik gorunuyor.",
        logs,
      };
    }

    if (looksLoggedOut) {
      addLog(logs, "Sahibinden giris ekrani veya cikmis oturum tespit edildi.");
      return {
        ok: true,
        status: "logged-out",
        browserRunning: true,
        currentUrl,
        message: "Sahibinden oturumu acik degil.",
        logs,
      };
    }

    addLog(logs, "Oturum durumu kesin belirlenemedi (unknown).");
    return {
      ok: true,
      status: "unknown",
      browserRunning: true,
      currentUrl,
      message: `Sahibinden durumu belirlenemedi (URL: ${currentUrl.slice(0, 50)}...)`,
      logs,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Bilinmeyen oturum kontrol hatasi";
    addLog(logs, `Hata: ${errorMsg}`);
    return {
      ok: false,
      status: "unknown",
      browserRunning: !!browser,
      currentUrl: page?.url(),
      message: `Oturum kontrolu sirasinda hata olustu: ${errorMsg}`,
      logs,
    };
  } finally {
    if (page && isNewPage) {
      addLog(logs, "Yeni olusturulan sekme kapatiliyor.");
      await page.close().catch(() => undefined);
    }
    
    if (browser) {
      await browser.disconnect().catch(() => undefined);
    }
  }
}
