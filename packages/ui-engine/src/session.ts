import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { existsSync } from "node:fs";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export interface LaunchOptions {
  headless?: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
  timeoutMs?: number;
}

const COMMON_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

function findSystemChrome(): string | undefined {
  for (const p of COMMON_CHROME_PATHS) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Launch a managed Playwright browser session with isolated context and page.
 */
export async function launchBrowserSession(
  options: LaunchOptions = {}
): Promise<BrowserSession> {
  const {
    headless = true,
    slowMo = 0,
    viewport = { width: 1280, height: 800 },
    timeoutMs = 30_000,
  } = options;

  const executablePath = findSystemChrome();

  const launchConfig: Parameters<typeof chromium.launch>[0] = {
    headless,
    slowMo,
    timeout: timeoutMs,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  };

  if (executablePath) {
    launchConfig.executablePath = executablePath;
  } else {
    launchConfig.channel = "chrome";
  }

  const browser = await chromium.launch(launchConfig);
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);

  return {
    browser,
    context,
    page,
  };
}

/**
 * Cleanly close the Playwright browser session.
 */
export async function closeBrowserSession(
  session: BrowserSession
): Promise<void> {
  try {
    if (session.page && !session.page.isClosed()) {
      await session.page.close();
    }
    if (session.context) {
      await session.context.close();
    }
    if (session.browser && session.browser.isConnected()) {
      await session.browser.close();
    }
  } catch {
    // Ignore cleanup errors
  }
}
