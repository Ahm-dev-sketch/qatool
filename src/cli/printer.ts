import type { RunReport, CaseResult, StepResult } from "../core/types.js";

// ANSI colour helpers — works on any modern terminal
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function pass(s: string): string { return `${c.green}${s}${c.reset}`; }
function fail(s: string): string { return `${c.red}${s}${c.reset}`; }
function warn(s: string): string { return `${c.yellow}${s}${c.reset}`; }
function dim(s: string): string  { return `${c.dim}${s}${c.reset}`; }
function bold(s: string): string { return `${c.bold}${s}${c.reset}`; }
function cyan(s: string): string { return `${c.cyan}${s}${c.reset}`; }

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function printStep(step: StepResult, indent = "    "): void {
  const icon = step.status === "pass" ? pass("✔") : fail("✘");
  console.log(`${indent}${icon} ${step.name} ${dim(formatDuration(step.durationMs))}`);

  if (step.status === "fail" && step.error) {
    console.log(`${indent}  ${fail("→")} ${step.error}`);
  }
}

function printCase(tc: CaseResult): void {
  const icon = tc.status === "pass" ? (tc.flaky ? warn("▲") : pass("●")) : fail("●");
  const tag = tc.tags.length ? dim(` [${tc.tags.join(", ")}]`) : "";
  const flakyBadge = tc.flaky ? warn(` [FLAKY - ${tc.attempts} attempts]`) : "";
  console.log(`  ${icon} ${bold(tc.name)}${tag}${flakyBadge} ${dim(formatDuration(tc.durationMs))}`);

  for (const step of tc.steps) {
    printStep(step);
  }
}

export function printReport(report: RunReport): void {
  const divider = dim("─".repeat(60));

  console.log();
  console.log(cyan(bold("  QATOOL RUN REPORT")));
  console.log(divider);
  console.log(`  Suite : ${report.suiteDir}`);
  console.log(`  Run ID: ${dim(report.runId)}`);
  console.log(`  Date  : ${report.startedAt.toISOString()}`);
  console.log(divider);
  console.log();

  for (const tc of report.cases) {
    printCase(tc);
    console.log();
  }

  console.log(divider);

  const flakyCount = report.cases.filter((c) => c.flaky).length;
  const flakySummary = flakyCount > 0 ? `, ${warn(`${flakyCount} flaky`)}` : "";

  const summary =
    report.failed === 0
      ? pass(`  ✔ All ${report.total} tests passed`) + flakySummary
      : fail(`  ✘ ${report.failed} failed`) + `, ${pass(`${report.passed} passed`)}` + flakySummary + `, ${report.total} total`;

  console.log(summary);
  console.log(`  Duration: ${formatDuration(report.durationMs)}`);
  console.log(divider);
  console.log();
}