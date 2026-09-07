#!/usr/bin/env node
import { parseArgs } from "./args.js";
import { runSuite, registerStepExecutor, persistRun } from "@qatool/core";
import { ApiStepExecutor, runConcurrentRequests, formatLoadReport } from "@qatool/api-engine";
import { UiStepExecutor } from "@qatool/ui-engine";
import { printReport } from "./printer.js";

// Register default step executors for API and UI testing
registerStepExecutor(new ApiStepExecutor());
registerStepExecutor(new UiStepExecutor());

const HELP_TEXT = `
qatool — Custom QA Automation Platform (v2)

USAGE
  qatool <command> [options]

COMMANDS
  run    Execute a test suite (API & UI tests)
  load   Execute concurrent load benchmark against an endpoint (Phase 2.6)

RUN OPTIONS
  --suite      Path to folder containing *.test.ts files  (required for run)
  --tags       Comma-separated tag filter (e.g. smoke,api,ui)
  --retries    Number of retries on failure (default: 0)
  --parallel   Number of parallel workers (default: 1)

LOAD BENCHMARK OPTIONS
  --url          Target HTTP URL (required for load)
  --method       HTTP Method (GET, POST, PUT, DELETE, PATCH; default: GET)
  --count        Total requests to fire (default: 20)
  --concurrency  Max parallel in-flight requests (default: 5)

GENERAL OPTIONS
  --help, -h   Show this help message
`.trim();

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.command === "") {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // ── 1. Suite Runner Command ────────────────────────────────────────────────
  if (args.command === "run") {
    if (!args.suite) {
      console.error("Error: --suite is required for the run command.");
      console.error("Example: qatool run --suite=./tests");
      process.exit(1);
    }

    try {
      const report = await runSuite({
        suiteDir: args.suite,
        tags: args.tags,
        maxRetries: args.retries,
        parallel: args.parallel,
      });

      printReport(report);
      await persistRun(report);
    } catch (err) {
      console.error("Fatal error during run:", err);
      process.exit(1);
    }

    return;
  }

  // ── 2. Concurrent Load Runner Command (Phase 2.6) ───────────────────────────
  if (args.command === "load") {
    if (!args.url) {
      console.error("Error: --url is required for the load command.");
      console.error("Example: qatool load --url=https://reqres.in/api/users --count=50 --concurrency=10");
      process.exit(1);
    }

    console.log(`\n🚀 Firing ${args.count} requests to ${args.method} ${args.url} (concurrency: ${args.concurrency})...`);
    
    try {
      const report = await runConcurrentRequests({
        url: args.url,
        method: args.method,
        count: args.count,
        concurrency: args.concurrency,
      });

      console.log(formatLoadReport(report));
    } catch (err) {
      console.error("Fatal error during load test:", err);
      process.exit(1);
    }

    return;
  }

  console.error(`Unknown command: "${args.command}". Run qatool --help for usage.`);
  process.exit(1);
}

main();
