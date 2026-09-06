import CDP from "chrome-remote-interface";
import { getText } from "./elements.js";

export interface BrowserAssertionResult {
  pass: boolean;
  message: string;
}

// ── Browser assertion functions ───────────────────────────────────────────────

/**
 * Assert that an element matching the CSS selector exists in the DOM.
 */
export async function assertElementExists(
  client: CDP.Client,
  selector: string,
): Promise<BrowserAssertionResult> {
  const { Runtime } = client;

  const result = await Runtime.evaluate({
    expression: `!!document.querySelector(${JSON.stringify(selector)})`,
    returnByValue: true,
  });

  const pass = result.result.value === true;
  return {
    pass,
    message: pass
      ? `Element "${selector}" exists`
      : `Expected element "${selector}" to exist, but it was not found`,
  };
}

/**
 * Assert that an element's text content equals the expected string.
 */
export async function assertTextEquals(
  client: CDP.Client,
  selector: string,
  expected: string,
): Promise<BrowserAssertionResult> {
  try {
    const actual = await getText(client, selector);
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
      message: `assertTextEquals: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Assert that an element's text content contains the expected substring.
 */
export async function assertTextContains(
  client: CDP.Client,
  selector: string,
  expected: string,
): Promise<BrowserAssertionResult> {
  try {
    const actual = await getText(client, selector);
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
      message: `assertTextContains: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Assert that an element is visible (exists + not display:none + not visibility:hidden).
 * Uses Runtime.evaluate to check computed styles.
 */
export async function assertIsVisible(
  client: CDP.Client,
  selector: string,
): Promise<BrowserAssertionResult> {
  const { Runtime } = client;

  const result = await Runtime.evaluate({
    expression: `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && style.opacity !== '0';
      })()
    `,
    returnByValue: true,
  });

  const pass = result.result.value === true;
  return {
    pass,
    message: pass
      ? `Element "${selector}" is visible`
      : `Expected element "${selector}" to be visible, but it was not`,
  };
}

/**
 * Assert the current page URL contains the given string.
 */
export async function assertUrlContains(
  client: CDP.Client,
  expected: string,
): Promise<BrowserAssertionResult> {
  const { Runtime } = client;

  const result = await Runtime.evaluate({
    expression: "window.location.href",
    returnByValue: true,
  });

  const actual = result.result.value as string;
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
  client: CDP.Client,
  expected: string,
): Promise<BrowserAssertionResult> {
  const { Runtime } = client;

  const result = await Runtime.evaluate({
    expression: "document.title",
    returnByValue: true,
  });

  const actual = result.result.value as string;
  const pass = actual.trim() === expected.trim();
  return {
    pass,
    message: pass
      ? `Page title equals "${expected}"`
      : `Expected page title to be "${expected}", got "${actual}"`,
  };
}