import { join } from "node:path";
import { launchBrowser, closeBrowser, type BrowserSession } from "./launcher.js";
import { navigate, waitForSelector, waitForUrl, captureScreenshot, getCurrentUrl, getTitle } from "./page.js";
import { click, type as typeText, getText, getAttribute, clearAndType } from "./elements.js";
import {
  assertElementExists,
  assertTextEquals,
  assertTextContains,
  assertIsVisible,
  assertUrlContains,
  assertTitleEquals,
} from "./assertions.js";
import type { StepResult, AssertionResult, StepExecutor } from "@qatool/core";

// ── Step payload types ────────────────────────────────────────────────────────

export type UiAction =
  | { action: "navigate"; url: string; timeoutMs?: number }
  | { action: "waitForSelector"; selector: string; timeoutMs?: number }
  | { action: "waitForUrl"; urlFragment: string; timeoutMs?: number }
  | { action: "click"; selector: string }
  | { action: "type"; selector: string; text: string }
  | { action: "clearAndType"; selector: string; text: string }
  | { action: "assertElementExists"; selector: string }
  | { action: "assertTextEquals"; selector: string; expected: string }
  | { action: "assertTextContains"; selector: string; expected: string }
  | { action: "assertIsVisible"; selector: string }
  | { action: "assertUrlContains"; expected: string }
  | { action: "assertTitleEquals"; expected: string };

export interface UiStepPayload {
  actions: UiAction[];
}

// ── Single step executor ──────────────────────────────────────────────────────

async function executeUiStep(
  stepId: string,
  stepName: string,
  payload: UiStepPayload,
  session: BrowserSession,
  screenshotDir: string,
): Promise<StepResult> {
  const start = Date.now();
  const assertionResults: AssertionResult[] = [];
  let assertionIndex = 0;

  try {
    for (const act of payload.actions) {
      switch (act.action) {
        // ── Navigation ────────────────────────────────────────────────────────
        case "navigate":
          await navigate(session.client, act.url, act.timeoutMs);
          break;

        case "waitForSelector":
          await waitForSelector(session.client, act.selector, act.timeoutMs);
          break;

        case "waitForUrl":
          await waitForUrl(session.client, act.urlFragment, act.timeoutMs);
          break;

        // ── Interaction ───────────────────────────────────────────────────────
        case "click":
          await click(session.client, act.selector);
          break;

        case "type":
          await typeText(session.client, act.selector, act.text);
          break;

        case "clearAndType":
          await clearAndType(session.client, act.selector, act.text);
          break;

        // ── Assertions ────────────────────────────────────────────────────────
        case "assertElementExists": {
          const result = await assertElementExists(session.client, act.selector);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id,
            stepId,
            type: act.action,
            expected: act.selector,
            actual: result.pass,
            pass: result.pass,
            message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertTextEquals": {
          const result = await assertTextEquals(session.client, act.selector, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id, stepId, type: act.action,
            expected: act.expected, actual: result.pass,
            pass: result.pass, message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertTextContains": {
          const result = await assertTextContains(session.client, act.selector, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id, stepId, type: act.action,
            expected: act.expected, actual: result.pass,
            pass: result.pass, message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertIsVisible": {
          const result = await assertIsVisible(session.client, act.selector);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id, stepId, type: act.action,
            expected: act.selector, actual: result.pass,
            pass: result.pass, message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertUrlContains": {
          const result = await assertUrlContains(session.client, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id, stepId, type: act.action,
            expected: act.expected, actual: result.pass,
            pass: result.pass, message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertTitleEquals": {
          const result = await assertTitleEquals(session.client, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id, stepId, type: act.action,
            expected: act.expected, actual: result.pass,
            pass: result.pass, message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        default: {
          const exhaustive: never = act;
          throw new Error(`Unknown UI action: ${JSON.stringify(exhaustive)}`);
        }
      }
    }

    return {
      id: stepId,
      name: stepName,
      status: "pass",
      durationMs: Date.now() - start,
      assertions: assertionResults,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Screenshot on failure
    try {
      const screenshotPath = join(screenshotDir, `${stepId}.png`);
      const saved = await captureScreenshot(session.client, screenshotPath);
      console.log(`  📸 Screenshot saved: ${saved}`);
    } catch {
      // Screenshot failure is non-fatal
    }

    return {
      id: stepId,
      name: stepName,
      status: "fail",
      durationMs: Date.now() - start,
      error: message,
      assertions: assertionResults,
    };
  }
}

// ── Test case executor ────────────────────────────────────────────────────────

export interface UiCaseStep {
  id: string;
  name: string;
  payload: UiStepPayload;
}

export class UiStepExecutor implements StepExecutor {
  private activeSession: BrowserSession | null = null;
  private activeRunId: string | null = null;

  canHandle(action: string): boolean {
    return action === "browser.step";
  }

  async getSession(): Promise<BrowserSession> {
    if (!this.activeSession) {
      this.activeSession = await launchBrowser();
    }
    return this.activeSession;
  }

  async closeActiveSession(): Promise<void> {
    if (this.activeSession) {
      await closeBrowser(this.activeSession);
      this.activeSession = null;
    }
  }

  async teardownCase(): Promise<void> {
    await this.closeActiveSession();
  }

  async execute(
    stepId: string,
    stepName: string,
    _action: string,
    payload: unknown,
    context: { runId: string }
  ): Promise<StepResult> {
    const session = await this.getSession();
    const screenshotDir = join("screenshots", context.runId);
    
    try {
      const result = await executeUiStep(stepId, stepName, payload as UiStepPayload, session, screenshotDir);
      if (result.status === "fail") {
        await this.closeActiveSession();
      }
      return result;
    } catch (err) {
      await this.closeActiveSession();
      throw err;
    }
  }
}