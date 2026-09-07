import type { CaseResult } from "./types.js";

export interface RetryOptions {
  maxRetries: number;
}

/**
 * Run a test case function with retry logic and flaky detection.
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
        console.log(
          `  ↻ Retrying "${result.name}" (attempt ${attempt + 1}/${totalAttempts})...`,
        );
        continue;
      }
      return {
        ...result,
        attempts: totalAttempts,
        flaky: false,
      };
    }

    return {
      ...result,
      attempts: attempt,
      flaky: hadFailure && attempt > 1,
    };
  }

  return { ...lastResult!, attempts: totalAttempts, flaky: false };
}
