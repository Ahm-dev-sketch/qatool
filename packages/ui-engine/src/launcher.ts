import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:net";
import CDP from "chrome-remote-interface";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

export interface BrowserSession {
  client: CDP.Client;
  process: ChildProcess;
  userDataDir: string;
  port: number;
}

/**
 * Find an available local port for Chrome DevTools Protocol.
 */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error("Unable to obtain free port")));
      }
    });
    srv.on("error", reject);
  });
}

/**
 * Poll connection to Chrome CDP port until successful or timeout.
 */
async function connectWithRetry(port: number, maxAttempts = 15, intervalMs = 200): Promise<CDP.Client> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await CDP({ port });
      return client;
    } catch (err) {
      lastError = err;
      await sleep(intervalMs);
    }
  }
  throw new Error(`Failed to connect to Chrome on port ${port} after ${maxAttempts} attempts: ${lastError}`);
}

/**
 * Spawn a headless Chrome instance with dynamic remote debugging port,
 * then connect chrome-remote-interface to it.
 */
export async function launchBrowser(): Promise<BrowserSession> {
  const port = await findFreePort();
  const userDataDir = join(tmpdir(), `qatool-chrome-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  await mkdir(userDataDir, { recursive: true });

  const args = [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--window-size=1280,800",
    "about:blank",
  ];

  const chromeProcess = spawn(CHROME_PATH, args, {
    stdio: "ignore",
    detached: false,
  });

  // Connect via CDP with polling retry
  const client = await connectWithRetry(port);

  // Enable the domains we'll use
  const { Page, Runtime, DOM, Network } = client;
  await Promise.all([
    Page.enable(),
    Runtime.enable(),
    DOM.enable(),
    Network.enable(),
  ]);

  return { client, process: chromeProcess, userDataDir, port };
}

/**
 * Close the CDP connection and kill the Chrome process.
 */
export async function closeBrowser(session: BrowserSession): Promise<void> {
  try {
    await session.client.close();
  } catch {
    // ignore close errors
  }
  
  try {
    session.process.kill("SIGTERM");
  } catch {
    // ignore kill errors
  }

  await sleep(150);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
