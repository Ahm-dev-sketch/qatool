import type { Page } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";

export interface ActionOptions {
  timeoutMs?: number;
}

/**
 * Navigate to a URL and wait until the DOM / network is in a ready state.
 */
export async function goto(
  page: Page,
  url: string,
  options: ActionOptions = {}
): Promise<void> {
  const { timeoutMs = 15_000 } = options;
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: timeoutMs,
  });
}

/**
 * Click on an element matching the selector with auto-scroll and wait.
 */
export async function click(
  page: Page,
  selector: string,
  options: ActionOptions = {}
): Promise<void> {
  const { timeoutMs = 10_000 } = options;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: timeoutMs });
  await locator.click({ timeout: timeoutMs });
}

/**
 * Type text into an input or textarea element.
 */
export async function type(
  page: Page,
  selector: string,
  text: string,
  options: ActionOptions = {}
): Promise<void> {
  const { timeoutMs = 10_000 } = options;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: timeoutMs });
  await locator.fill(text, { timeout: timeoutMs });
}

/**
 * Clear existing input value, then type new text.
 */
export async function clearAndType(
  page: Page,
  selector: string,
  text: string,
  options: ActionOptions = {}
): Promise<void> {
  const { timeoutMs = 10_000 } = options;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: timeoutMs });
  await locator.clear({ timeout: timeoutMs });
  await locator.fill(text, { timeout: timeoutMs });
}

/**
 * Get inner text from an element.
 */
export async function getText(
  page: Page,
  selector: string,
  options: ActionOptions = {}
): Promise<string> {
  const { timeoutMs = 10_000 } = options;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "attached", timeout: timeoutMs });
  const text = await locator.innerText({ timeout: timeoutMs });
  return text.trim();
}

/**
 * Get an attribute value from an element.
 */
export async function getAttribute(
  page: Page,
  selector: string,
  attribute: string,
  options: ActionOptions = {}
): Promise<string | null> {
  const { timeoutMs = 10_000 } = options;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "attached", timeout: timeoutMs });
  return await locator.getAttribute(attribute, { timeout: timeoutMs });
}

/**
 * Wait for an element to appear in the DOM and become visible.
 */
export async function waitFor(
  page: Page,
  selector: string,
  options: ActionOptions = {}
): Promise<void> {
  const { timeoutMs = 10_000 } = options;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: timeoutMs });
}

/**
 * Wait for the page URL to contain a specific fragment.
 */
export async function waitForUrl(
  page: Page,
  urlFragment: string,
  options: ActionOptions = {}
): Promise<void> {
  const { timeoutMs = 10_000 } = options;
  await page.waitForURL((url) => url.href.includes(urlFragment), {
    timeout: timeoutMs,
  });
}

/**
 * Capture a screenshot and save to disk.
 */
export async function captureScreenshot(
  page: Page,
  outputPath: string
): Promise<string> {
  const absPath = resolve(outputPath);
  await mkdir(dirname(absPath), { recursive: true });
  await page.screenshot({ path: absPath, fullPage: false });
  return absPath;
}

/**
 * Get current page URL.
 */
export function getCurrentUrl(page: Page): string {
  return page.url();
}

/**
 * Get page title.
 */
export async function getTitle(page: Page): Promise<string> {
  return await page.title();
}
