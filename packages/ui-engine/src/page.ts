import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import CDP from "chrome-remote-interface";

const POLL_INTERVAL_MS = 100;
const DEFAULT_TIMEOUT_MS = 10_000;

export interface PageClient {
  client: CDP.Client;
}

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Navigate to a URL and wait for the load event to fire.
 * Uses Page.navigate + Page.loadEventFired (stable, non-experimental CDP).
 */
export async function navigate(
  client: CDP.Client,
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const { Page } = client;

  // Race navigation against a timeout
  await Promise.race([
    (async () => {
      await Page.navigate({ url });
      await Page.loadEventFired();
    })(),
    rejectAfter(timeoutMs, `navigate("${url}") timed out after ${timeoutMs}ms`),
  ]);
}

// ── Waiting ───────────────────────────────────────────────────────────────────

/**
 * Poll for a CSS selector until it appears in the DOM or timeout is reached.
 * Uses Runtime.evaluate to call document.querySelector in the page context.
 */
export async function waitForSelector(
  client: CDP.Client,
  selector: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const { Runtime } = client;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await Runtime.evaluate({
      expression: `!!document.querySelector(${JSON.stringify(selector)})`,
      returnByValue: true,
    });

    if (result.result.value === true) return;

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `waitForSelector("${selector}") timed out after ${timeoutMs}ms`,
  );
}

/**
 * Wait for the page URL to include a given string (useful after form submissions).
 */
export async function waitForUrl(
  client: CDP.Client,
  urlFragment: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const { Runtime } = client;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await Runtime.evaluate({
      expression: `window.location.href`,
      returnByValue: true,
    });

    const href = result.result.value as string;
    if (href.includes(urlFragment)) return;

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `waitForUrl("${urlFragment}") timed out after ${timeoutMs}ms`,
  );
}

// ── Screenshot ────────────────────────────────────────────────────────────────

/**
 * Capture a screenshot and save it to disk.
 * Returns the absolute path of the saved file.
 * Uses Page.captureScreenshot — returns base64 PNG data.
 */
export async function captureScreenshot(
  client: CDP.Client,
  outputPath: string,
): Promise<string> {
  const { Page } = client;

  const { data } = await Page.captureScreenshot({ format: "png" });

  const absPath = resolve(outputPath);
  const dir = absPath.substring(0, absPath.lastIndexOf("\\") || absPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });

  await writeFile(absPath, Buffer.from(data, "base64"));
  return absPath;
}

/**
 * Get the current page URL via Runtime.evaluate.
 */
export async function getCurrentUrl(client: CDP.Client): Promise<string> {
  const { Runtime } = client;
  const result = await Runtime.evaluate({
    expression: "window.location.href",
    returnByValue: true,
  });
  return result.result.value as string;
}

/**
 * Get the page title.
 */
export async function getTitle(client: CDP.Client): Promise<string> {
  const { Runtime } = client;
  const result = await Runtime.evaluate({
    expression: "document.title",
    returnByValue: true,
  });
  return result.result.value as string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms),
  );
}