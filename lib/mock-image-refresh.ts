// mock-image/images.py ile havuz yenileme. Hem /api/mock-images/refresh hem kuyruk motoru kullanır.
import { spawn } from "node:child_process";
import path from "node:path";

const SCRIPT_TIMEOUT_MS = 180_000;

export type RefreshResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  stdout?: string;
  stderrTail?: string;
  code?: number | null;
  durationMs?: number;
  [key: string]: unknown;
};

// Aynı anda tek yenileme (kuyruk başında tetiklenir). Süreç içinde tüm çağıranlar paylaşır.
const g = globalThis as unknown as { __ilanlaMockRefreshInFlight?: Promise<RefreshResult> | null };

function runImagesPy(models: string[]): Promise<RefreshResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const pythonBin = process.env.PYTHON_BIN || "python3";
    const script = path.join(process.cwd(), "mock-image", "images.py");
    const args = [script];
    for (const model of models) args.push("--model", model);

    const child = spawn(pythonBin, args, {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: RefreshResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...result, durationMs: Date.now() - started });
    };

    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* zaten ölü */
      }
      finish({ ok: false, error: "timeout", stdout, stderrTail: stderr.slice(-2000) });
    }, SCRIPT_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      finish({ ok: false, error: `spawn failed: ${err.message}`, stderrTail: stderr.slice(-2000) });
    });
    child.on("close", (code) => {
      const lines = stdout.trim().split("\n").filter(Boolean);
      const lastLine = lines[lines.length - 1] ?? "";
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(lastLine);
      } catch {
        parsed = null;
      }

      if (code === 0 && parsed && typeof parsed === "object") {
        finish({ ok: true, ...parsed });
      } else {
        finish({
          ok: false,
          error: parsed && typeof parsed.error === "string" ? parsed.error : `exit ${code}`,
          code,
          stdout: stdout.slice(-2000),
          stderrTail: stderr.slice(-2000),
        });
      }
    });
  });
}

/** Verilen model klasörlerini (boşsa tümünü) yeniler. Yenileme sürüyorsa onu bekler ve `skipped: true` döner. */
export async function refreshMockImagePools(models: string[]): Promise<RefreshResult> {
  if (g.__ilanlaMockRefreshInFlight) {
    const result = await g.__ilanlaMockRefreshInFlight;
    return { ...result, skipped: true };
  }
  const run = runImagesPy(models).finally(() => {
    g.__ilanlaMockRefreshInFlight = null;
  });
  g.__ilanlaMockRefreshInFlight = run;
  return run;
}
