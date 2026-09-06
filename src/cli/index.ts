#!/usr/bin/env node
import { parseArgs } from "./args.js";
import { runSuite } from "../core/runner.js";
import { persistRun } from "../db/persist.js";
import { printReport } from "./printer.js";

const HELP_TEXT = `
qatool — Custom QA Automation Toolkit

USAGE
  qatool run --suite=<path> [--tags=<tag1,tag2>]

COMMANDS
  run    Execute a test suite

OPTIONS
  --suite   Path to folder containing *.test.ts files  (required for run)
  --tags    Comma-separated tag filter (e.g. smoke,regression)
  --retries  Number of retries on failure (default: 0)
  --parallel Number of parallel workers (default: 1)
  --help    Show this help message
`.trim();

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.command === "") {
    console.log(HELP_TEXT);
    process.exit(0);
  }

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

  console.error(`Unknown command: "${args.command}". Run qatool --help for usage.`);
  process.exit(1);
}

main();