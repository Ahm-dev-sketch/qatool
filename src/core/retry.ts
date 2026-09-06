import type { CaseResult } from "./types.js";

export interface RetryOptions {
  maxRetries: number;    // 0 = run once, 1 = run up to 2 times, etc.
}

/**
 * Run a test case function with retry logic and flaky detection.
 *
 * - If maxRetries === 0: run once, return result as-is.
 * - If test fails and retries remain: re-run the case function.
 * - If a later attempt passes after an earlier failure: mark result as flaky.
 * - If all attempts fail: return the last failure result (not flaky).
 *
 * @param runFn   Async function that executes one test case attempt, returns CaseResult
 * @param options Retry configuration
 */
export async function withRetry(
  runFn: () => Promise<CaseResult>,
  options: RetryOptions,
): Promise<CaseResult> {
  const { maxRetries } = options;
  const totalAttempts = maxRetries + 1;

  let lastResult: CaseResult | undefined;
  let hadFailure = false;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    const result = await runFn();
    lastResult = result;

    if (result.status === "fail") {
      hadFailure = true;
      if (attempt < totalAttempts) {
        // Will retry — log the retry attempt
        console.log(
          `  ↻ Retrying "${result.name}" (attempt ${attempt + 1}/${totalAttempts})...`,
        );
        continue;
      }
      // All attempts failed — return last failure, not flaky
      return {
        ...result,
        attempts: totalAttempts,
        flaky: false,
      };
    }

    // Passed on this attempt
    return {
      ...result,
      attempts: attempt,
      flaky: hadFailure && attempt > 1, // passed after a previous failure = flaky
    };
  }

  // Should never reach here, but TypeScript needs it
  return { ...lastResult!, attempts: totalAttempts, flaky: false };
}