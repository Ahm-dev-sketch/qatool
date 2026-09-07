import type { Page } from "playwright-core";
import { getText, getCurrentUrl, getTitle } from "./dsl.js";

export interface BrowserAssertionResult {
  pass: boolean;
  message: string;
}

/**
 * Assert that an element matching the selector exists in the DOM.
 */
export async function assertElementExists(
  page: Page,
  selector: string,
  timeoutMs = 5000
): Promise<BrowserAssertionResult> {
  try {
    const count = await page.locator(selector).count();
    const pass = count > 0;
    return {
      pass,
      message: pass
        ? `Element "${selector}" exists (count: ${count})`
        : `Expected element "${selector}" to exist, but found 0 elements`,
    };
  } catch (err) {
    return {
      pass: false,
      message: `assertElementExists error on "${selector}": ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Assert that an element is visible in the viewport.
 */
export async function assertIsVisible(
  page: Page,
  selector: string,
  timeoutMs = 5000
): Promise<BrowserAssertionResult> {
  try {
    const isVis = await page.locator(selector).first().isVisible({ timeout: timeoutMs });
    return {
      pass: isVis,
      message: isVis
        ? `Element "${selector}" is visible`
        : `Expected element "${selector}" to be visible, but it was not`,
    };
  } catch (err) {
    return {
      pass: false,
      message: `assertIsVisible error on "${selector}": ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Assert that an element's text equals the expected string.
 */
export async function assertTextEquals(
  page: Page,
  selector: string,
  expected: string
): Promise<BrowserAssertionResult> {
  try {
    const actual = await getText(page, selector);
    const pass = actual.trim() === expected.trim();
    return {
      pass,
      message: pass
        ? `Text of "${selector}" equals "${expected}"`
        : `Expected text of "${selector}" to be "${expected}", got "${actual.trim()}"`,
    };
  } catch (err) {
    return {
      pass: false,
      message: `assertTextEquals error on "${selector}": ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Assert that an element's text contains the expected substring.
 */
export async function assertTextContains(
  page: Page,
  selector: string,
  expected: string
): Promise<BrowserAssertionResult> {
  try {
    const actual = await getText(page, selector);
    const pass = actual.includes(expected);
    return {
      pass,
      message: pass
        ? `Text of "${selector}" contains "${expected}"`
        : `Expected text of "${selector}" to contain "${expected}", got "${actual}"`,
    };
  } catch (err) {
    return {
      pass: false,
      message: `assertTextContains error on "${selector}": ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Assert the current URL contains the expected substring.
 */
export function assertUrlContains(
  page: Page,
  expected: string
): BrowserAssertionResult {
  const actual = getCurrentUrl(page);
  const pass = actual.includes(expected);
  return {
    pass,
    message: pass
      ? `URL contains "${expected}"`
      : `Expected URL to contain "${expected}", got "${actual}"`,
  };
}

/**
 * Assert the page title equals the expected string.
 */
export async function assertTitleEquals(
  page: Page,
  expected: string
): Promise<BrowserAssertionResult> {
  try {
    const actual = await getTitle(page);
    const pass = actual.trim() === expected.trim();
    return {
      pass,
      message: pass
        ? `Page title equals "${expected}"`
        : `Expected page title to be "${expected}", got "${actual}"`,
    };
  } catch (err) {
    return {
      pass: false,
      message: `assertTitleEquals error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
