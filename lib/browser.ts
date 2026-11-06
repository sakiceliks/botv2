import os from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export function getUserDataDir() {
  const configured = process.env.PUPPETEER_USER_DATA_DIR?.trim();
  if (!configured) {
    const legacyRepoProfile = path.join(process.cwd(), "chrome-profile");
    if (existsSync(legacyRepoProfile)) {
      return legacyRepoProfile;
    }

    return path.join(os.homedir(), ".nextbot", "chrome-profile");
  }

  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

// Paylaşılan launch flag'leri — puppeteer.launch ve manuel spawn (browser-session)
// aynı profili/paylaşımlı portu kullandığı için tutarlı olmalı.
// Bilinçli olarak YOK: --single-process (macOS crash), --no-zygote, --no-sandbox
// (girişli profilde güvenlik riski).
export const BROWSER_LAUNCH_FLAGS: string[] = [
  "--disable-extensions",
  // Bellek / render
  "--disable-dev-shm-usage",
  "--disable-gpu",
  // Arka plan kısıtlamaları — otomasyon arka plandayken yavaşlamasın
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  // Gereksiz ilk çalıştırma & servisler
  "--no-first-run",
  "--no-default-browser-check",
  "--mute-audio",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-sync",
  "--disable-translate",
  "--metrics-recording-only",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
];

const BROWSER_PATHS: Record<string, string> = {
  "macos-brave":    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "macos-chrome":   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "macos-chromium": "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "windows-chrome": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "windows-brave":  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "linux-chrome":   "/usr/bin/google-chrome",
  "linux-brave":    "/usr/bin/brave-browser",
};

export function resolveChromeExecutable() {
  const platform = process.env.BROWSER_PLATFORM?.trim();
  if (platform && BROWSER_PATHS[platform]) {
    return BROWSER_PATHS[platform];
  }

  if (process.env.CHROME_EXECUTABLE_PATH) {
    return process.env.CHROME_EXECUTABLE_PATH;
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    path.join(os.homedir(), "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    path.join(os.homedir(), "Applications/Brave Browser.app/Contents/MacOS/Brave Browser")
  ];

  return candidates.find(existsSync) || candidates[0];
}

function getRuntimeDir() {
  return path.join(process.cwd(), ".nextbot");
}

function getSessionFilePath() {
  return path.join(getRuntimeDir(), "browser-session.json");
}

export async function writeBrowserSession(data: {
  port: number;
  targetUrl: string;
  userDataDir: string;
  executablePath: string;
}) {
  await mkdir(getRuntimeDir(), { recursive: true });
  await writeFile(getSessionFilePath(), JSON.stringify(data, null, 2), "utf8");
}

export async function readBrowserSession(): Promise<null | {
  port: number;
  targetUrl: string;
  userDataDir: string;
  executablePath: string;
}> {
  try {
    const raw = await readFile(getSessionFilePath(), "utf8");
    return JSON.parse(raw) as {
      port: number;
      targetUrl: string;
      userDataDir: string;
      executablePath: string;
    };
  } catch {
    return null;
  }
}
