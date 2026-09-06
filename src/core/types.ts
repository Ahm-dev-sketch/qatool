export type TestType = "api" | "ui";
export type StepStatus = "pass" | "fail" | "skip";

export interface AssertionDef {
  id: string;
  stepId: string;
  type:
    | "toEqual"
    | "toContain"
    | "toBeStatus"
    | "toHaveText"
    | "toBeGreaterThan"
    | "toBeTruthy";
  expected?: unknown;
  actual: unknown;
}

export interface StepDef {
  id: string;
  name: string;
  action: string;
  payload?: unknown;
}

export interface TestCase {
  id: string;
  name: string;
  type: TestType;
  tags: string[];
  steps: StepDef[];
  assertions: AssertionDef[];
}

// ── Runtime result types ──────────────────────────────────────────────────────

export interface AssertionResult {
  id: string;
  stepId: string;
  type: string;
  expected: unknown;
  actual: unknown;
  pass: boolean;
  message: string;
}

export interface StepResult {
  id: string;
  name: string;
  status: StepStatus;
  durationMs: number;
  error?: string;
  assertions: AssertionResult[];
}

export interface CaseResult {
  id: string;
  name: string;
  type: TestType;
  tags: string[];
  status: StepStatus;
  durationMs: number;
  steps: StepResult[];
  flaky?: boolean;        // true if test failed then passed on retry
  attempts?: number;      // total attempts made (1 = no retry needed)
}

export interface RunReport {
  runId: string;
  suiteDir: string;
  startedAt: Date;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  cases: CaseResult[];
}

export interface RunnerOptions {
  suiteDir: string;
  tags?: string[];
  maxRetries?: number;   // 0 = no retry (default), N = retry up to N times
  parallel?: number;     // number of parallel workers (1 = sequential, default)
}