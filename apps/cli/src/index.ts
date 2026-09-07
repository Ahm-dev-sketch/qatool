#!/usr/bin/env node
import { parseArgs } from "./args.js";
import { runSuite, registerStepExecutor, persistRun } from "@qatool/core";
import { ApiStepExecutor, runConcurrentRequests, formatLoadReport } from "@qatool/api-engine";
import { UiStepExecutor } from "@qatool/ui-engine";
import {
  generateUsers,
  generateProducts,
  generateTransactions,
  generateCustomRecords,
  toJSON,
  toCSV,
} from "@qatool/data-gen";
import { syncFailuresToGitHub } from "@qatool/integrations";
import { printReport } from "./printer.js";

// Register default step executors for API and UI testing
registerStepExecutor(new ApiStepExecutor());
registerStepExecutor(new UiStepExecutor());

const HELP_TEXT = `
qatool — Custom QA Automation Platform (v2)

USAGE
  qatool <command> [subcommand] [options]

COMMANDS
  run    Execute a test suite (API & UI tests)
  load   Execute concurrent load benchmark against an endpoint (Phase 2.6)
  gen    Generate realistic mock test data fixtures (Phase 4.5)

RUN OPTIONS
  --suite        Path to folder containing *.test.ts files  (required for run)
  --tags         Comma-separated tag filter (e.g. smoke,api,ui,regression)
  --retries      Number of retries on failure (default: 0)
  --parallel     Number of parallel workers (default: 1)
  --github-sync  Auto-create/update GitHub Issue on failure with deduplication (Phase 4.6)

LOAD BENCHMARK OPTIONS
  --url          Target HTTP URL (required for load)
  --method       HTTP Method (GET, POST, PUT, DELETE, PATCH; default: GET)
  --count        Total requests to fire (default: 20)
  --concurrency  Max parallel in-flight requests (default: 5)

DATA GENERATOR OPTIONS
  qatool gen users         Generate fake user accounts (default count: 10)
  qatool gen products      Generate fake product items with SKU and pricing
  qatool gen transactions  Generate fake financial payment transactions
  qatool gen custom        Generate custom objects using --fields="name:string,age:number,email:email"
  --count                  Number of records to generate (default: 10)
  --format                 Output format: json, csv, table (default: json)

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

      // Phase 4.6: GitHub Issue Auto-Creation on failure with deduplication
      if (args.githubSync && report.failed > 0) {
        console.log("  🐙 Syncing failures to GitHub Issues...");
        await syncFailuresToGitHub(report, {
          tagsFilter: args.tags.length > 0 ? args.tags : undefined,
        });
      }
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

  // ── 3. Test Data Generator Command (Phase 4.5) ─────────────────────────────
  if (args.command === "gen") {
    const entity = (args.subcommand || "users").toLowerCase();
    const count = args.count || 10;
    let data: any[];

    switch (entity) {
      case "users":
      case "user":
        data = generateUsers(count);
        break;
      case "products":
      case "product":
        data = generateProducts(count);
        break;
      case "transactions":
      case "transaction":
        data = generateTransactions(count);
        break;
      case "custom":
        if (!args.fields) {
          console.error("Error: --fields is required for custom generator.");
          console.error('Example: qatool gen custom --fields="fullName:name,age:number,email:email" --count=5');
          process.exit(1);
        }
        data = generateCustomRecords(args.fields, count);
        break;
      default:
        console.error(`Unknown entity: "${entity}". Available: users, products, transactions, custom`);
        process.exit(1);
    }

    if (args.format === "csv") {
      console.log(toCSV(data));
    } else if (args.format === "table") {
      console.table(data);
    } else {
      console.log(toJSON(data));
    }

    return;
  }

  console.error(`Unknown command: "${args.command}". Run qatool --help for usage.`);
  process.exit(1);
}

main();
