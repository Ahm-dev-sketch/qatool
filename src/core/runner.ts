import { readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import type { TestCase, RunReport, CaseResult, StepResult, RunnerOptions } from "./types.js";
import { runAssertion } from "./assertions.js";
import { executeApiStep, resetStore, type ApiStepPayload } from "../api/executor.js";
import { executeUiCase, type UiStepPayload } from "../browser/executor.js";
import { withRetry } from "./retry.js";
import { runParallel } from "./orchestrator.js";

// ── File discovery ────────────────────────────────────────────────────────────
async function discoverTestFiles(suiteDir: string): Promise<string[]> {
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
  let stepResults: StepResult[] = [];

  // Reset variable store per test case so chains don't leak between cases
  resetStore();

  // ── UI test case: batch all steps to the browser executor ──────────────────
  if (tc.type === "ui") {
    const uiSteps = tc.steps.map((s) => ({
      id: s.id,
      name: s.name,
      payload: s.payload as UiStepPayload,
    }));
    stepResults = await executeUiCase(uiSteps, runId);
  } else {
    // ── API / static steps ────────────────────────────────────────────────────
    for (const step of tc.steps) {
      if (step.action === "http.request") {
        const result = await executeApiStep(
          step.id,
          step.name,
          step.payload as ApiStepPayload,
        );
        stepResults.push(result);
        continue;
      }

      // Phase 1 static assertion step
      const stepStart = Date.now();
      const stepAssertions = tc.assertions.filter((a) => a.stepId === step.id);
      const assertionResults = stepAssertions.map(runAssertion);

      const allPass = assertionResults.every((a) => a.pass);
      const failed = assertionResults.find((a) => !a.pass);

      stepResults.push({
        id: step.id,
        name: step.name,
        status: allPass ? "pass" : "fail",
        durationMs: Date.now() - stepStart,
        error: failed ? failed.message : undefined,
        assertions: assertionResults,
      });
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

function matchesTags(tc: TestCase, filterTags: string[]): boolean {
  if (filterTags.length === 0) return true;
  return filterTags.some((tag) => tc.tags.includes(tag));
}

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
    // Dynamic import — convert to file:// URL for Windows ESM compatibility
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