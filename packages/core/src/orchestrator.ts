import type { CaseResult } from "./types.js";

/**
 * Concurrency limiter — run at most `concurrency` tasks at once.
 * Uses a semaphore pattern.
 */
export class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private readonly concurrency: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running++;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

export interface ParallelRunnerOptions {
  concurrency: number;
}

export async function runParallel(
  runFns: Array<() => Promise<CaseResult>>,
  options: ParallelRunnerOptions,
): Promise<CaseResult[]> {
  const semaphore = new Semaphore(options.concurrency);
  const results = new Array<CaseResult>(runFns.length);

  await Promise.all(
    runFns.map(async (fn, index) => {
      await semaphore.acquire();
      try {
        results[index] = await fn();
      } finally {
        semaphore.release();
      }
    }),
  );

  return results;
}
