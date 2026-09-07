import { readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import type { TestCase, RunReport, CaseResult, StepResult, RunnerOptions, StepExecutor } from "./types.js";
import { runAssertion } from "./assertions.js";
import { withRetry } from "./retry.js";
import { runParallel } from "./orchestrator.js";

// ── Registry for step executors (API, UI, Load, etc.) ─────────────────────────

const stepExecutors: StepExecutor[] = [];

export function registerStepExecutor(executor: StepExecutor): void {
  stepExecutors.push(executor);
}

// ── File discovery ────────────────────────────────────────────────────────────

export async function discoverTestFiles(suiteDir: string): Promise<string[]> {
  const abs = resolve(suiteDir);
  const entries = await readdir(abs, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(join(abs, entry.name));
    }
  }

  return files.sort();
}

// ── Single test case execution ────────────────────────────────────────────────

export async function executeCase(tc: TestCase, runId: string): Promise<CaseResult> {
  const caseStart = Date.now();
  const stepResults: StepResult[] = [];

  try {
    for (const step of tc.steps) {
      // Check if any registered executor can handle this step action
      const customExecutor = stepExecutors.find((exec) => exec.canHandle(step.action));

      if (customExecutor) {
        const result = await customExecutor.execute(
          step.id,
          step.name,
          step.action,
          step.payload,
          { runId }
        );
        stepResults.push(result);
        if (result.status === "fail") break;
        continue;
      }

      // Default static assertion step
      const stepStart = Date.now();
      const stepAssertions = tc.assertions.filter((a) => a.stepId === step.id);
      const assertionResults = stepAssertions.map(runAssertion);

      const allPass = assertionResults.every((a) => a.pass);
      const failed = assertionResults.find((a) => !a.pass);

      const stepResult: StepResult = {
        id: step.id,
        name: step.name,
        status: allPass ? "pass" : "fail",
        durationMs: Date.now() - stepStart,
        error: failed ? failed.message : undefined,
        assertions: assertionResults,
      };

      stepResults.push(stepResult);
      if (stepResult.status === "fail") break;
    }
  } finally {
    for (const exec of stepExecutors) {
      if (exec.teardownCase) {
        try {
          await exec.teardownCase({ runId });
        } catch {}
      }
    }
  }

  const caseStatus = stepResults.every((s) => s.status === "pass") ? "pass" : "fail";

  return {
    id: tc.id,
    name: tc.name,
    type: tc.type,
    tags: tc.tags,
    status: caseStatus,
    durationMs: Date.now() - caseStart,
    steps: stepResults,
  };
}

// ── Tag filtering ─────────────────────────────────────────────────────────────

export function matchesTags(tc: TestCase, filterTags: string[]): boolean {
  if (filterTags.length === 0) return true;
  return filterTags.some((tag) => tc.tags.includes(tag));
}

// ── Main suite runner ─────────────────────────────────────────────────────────

export async function runSuite(options: RunnerOptions): Promise<RunReport> {
  const { suiteDir, tags = [], maxRetries = 0, parallel = 1 } = options;
  const runId = randomUUID();
  const startedAt = new Date();
  const runStart = Date.now();

  const files = await discoverTestFiles(suiteDir);

  if (files.length === 0) {
    console.warn(`⚠  No *.test.ts files found in ${suiteDir}`);
  }

  // Load all matching test cases
  const testCases: TestCase[] = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(file).href) as { default: TestCase };
    const tc: TestCase = mod.default;
    if (matchesTags(tc, tags)) testCases.push(tc);
  }

  // Build runner functions (each wraps executeCase with retry)
  const runFns = testCases.map((tc) => () =>
    withRetry(() => executeCase(tc, runId), { maxRetries }),
  );

  // Execute — parallel or sequential
  let cases: CaseResult[];
  if (parallel > 1) {
    console.log(`  ⚡ Running ${testCases.length} tests with concurrency=${parallel}`);
    cases = await runParallel(runFns, { concurrency: parallel });
  } else {
    cases = [];
    for (const fn of runFns) {
      cases.push(await fn());
    }
  }

  const passed = cases.filter((c) => c.status === "pass").length;
  const failed = cases.filter((c) => c.status === "fail").length;
  const flaky = cases.filter((c) => c.flaky).length;

  if (flaky > 0) {
    console.log(`  ⚠  ${flaky} flaky test(s) detected`);
  }

  return {
    runId,
    suiteDir: resolve(suiteDir),
    startedAt,
    durationMs: Date.now() - runStart,
    total: cases.length,
    passed,
    failed,
    cases,
  };
}
