import { join } from "node:path";
import { launchBrowserSession, closeBrowserSession, type BrowserSession } from "./session.js";
import {
  goto,
  click,
  type as typeText,
  clearAndType,
  waitFor,
  waitForUrl,
  captureScreenshot,
} from "./dsl.js";
import {
  assertElementExists,
  assertIsVisible,
  assertTextEquals,
  assertTextContains,
  assertUrlContains,
  assertTitleEquals,
} from "./assertions.js";
import type { StepResult, AssertionResult, StepExecutor } from "@qatool/core";

export type UiAction =
  | { action: "navigate" | "goto"; url: string; timeoutMs?: number }
  | { action: "waitForSelector" | "waitFor"; selector: string; timeoutMs?: number }
  | { action: "waitForUrl"; urlFragment: string; timeoutMs?: number }
  | { action: "click"; selector: string; timeoutMs?: number }
  | { action: "type"; selector: string; text: string; timeoutMs?: number }
  | { action: "clearAndType"; selector: string; text: string; timeoutMs?: number }
  | { action: "assertElementExists"; selector: string; timeoutMs?: number }
  | { action: "assertIsVisible"; selector: string; timeoutMs?: number }
  | { action: "assertTextEquals"; selector: string; expected: string }
  | { action: "assertTextContains"; selector: string; expected: string }
  | { action: "assertUrlContains"; expected: string }
  | { action: "assertTitleEquals"; expected: string };

export interface UiStepPayload {
  actions: UiAction[];
}

async function executeUiStep(
  stepId: string,
  stepName: string,
  payload: UiStepPayload,
  session: BrowserSession,
  screenshotDir: string
): Promise<StepResult> {
  const start = Date.now();
  const assertionResults: AssertionResult[] = [];
  let assertionIndex = 0;

  try {
    for (const act of payload.actions) {
      switch (act.action) {
        case "navigate":
        case "goto":
          await goto(session.page, act.url, { timeoutMs: act.timeoutMs });
          break;

        case "waitForSelector":
        case "waitFor":
          await waitFor(session.page, act.selector, { timeoutMs: act.timeoutMs });
          break;

        case "waitForUrl":
          await waitForUrl(session.page, act.urlFragment, { timeoutMs: act.timeoutMs });
          break;

        case "click":
          await click(session.page, act.selector, { timeoutMs: act.timeoutMs });
          break;

        case "type":
          await typeText(session.page, act.selector, act.text, { timeoutMs: act.timeoutMs });
          break;

        case "clearAndType":
          await clearAndType(session.page, act.selector, act.text, { timeoutMs: act.timeoutMs });
          break;

        case "assertElementExists": {
          const result = await assertElementExists(session.page, act.selector, act.timeoutMs);
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

        case "assertIsVisible": {
          const result = await assertIsVisible(session.page, act.selector, act.timeoutMs);
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
          const result = await assertTextEquals(session.page, act.selector, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id,
            stepId,
            type: act.action,
            expected: act.expected,
            actual: result.pass,
            pass: result.pass,
            message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertTextContains": {
          const result = await assertTextContains(session.page, act.selector, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id,
            stepId,
            type: act.action,
            expected: act.expected,
            actual: result.pass,
            pass: result.pass,
            message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertUrlContains": {
          const result = assertUrlContains(session.page, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id,
            stepId,
            type: act.action,
            expected: act.expected,
            actual: result.pass,
            pass: result.pass,
            message: result.message,
          });
          if (!result.pass) throw new Error(result.message);
          break;
        }

        case "assertTitleEquals": {
          const result = await assertTitleEquals(session.page, act.expected);
          const id = `${stepId}-a${++assertionIndex}`;
          assertionResults.push({
            id,
            stepId,
            type: act.action,
            expected: act.expected,
            actual: result.pass,
            pass: result.pass,
            message: result.message,
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

    // Auto-capture screenshot on step failure
    try {
      const screenshotPath = join(screenshotDir, `${stepId}.png`);
      const saved = await captureScreenshot(session.page, screenshotPath);
      console.log(`  📸 Screenshot saved: ${saved}`);
    } catch {
      // Screenshot capture failure is non-fatal
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

export class UiStepExecutor implements StepExecutor {
  private activeSession: BrowserSession | null = null;

  canHandle(action: string): boolean {
    return action === "browser.step" || action === "ui.step";
  }

  async getSession(): Promise<BrowserSession> {
    if (!this.activeSession) {
      this.activeSession = await launchBrowserSession();
    }
    return this.activeSession;
  }

  async closeActiveSession(): Promise<void> {
    if (this.activeSession) {
      await closeBrowserSession(this.activeSession);
      this.activeSession = null;
    }
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
      const result = await executeUiStep(
        stepId,
        stepName,
        payload as UiStepPayload,
        session,
        screenshotDir
      );
      if (result.status === "fail") {
        await this.closeActiveSession();
      }
      return result;
    } catch (err) {
      await this.closeActiveSession();
      throw err;
    }
  }

  async teardownCase(): Promise<void> {
    await this.closeActiveSession();
  }
}
