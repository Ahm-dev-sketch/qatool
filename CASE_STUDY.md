# 📘 Case Study: Building a Unified QA Automation Platform from Scratch

**Author**: Senior QA & Test Automation Engineer  
**Project**: QATOOL (Consolidated QA Automation Monorepo)  
**Architecture**: Monorepo Workspaces (`@qatool/core`, `@qatool/api-engine`, `@qatool/ui-engine`, `@qatool/data-gen`, `@qatool/integrations`, `apps/cli`, `apps/dashboard`)  
**Stack**: TypeScript, Node.js 20+, Playwright-Core, Prisma 7, PostgreSQL 17, Next.js 15, Tailwind CSS, Recharts, Faker.js, Octokit

---

## 1. Executive Summary & Problem Statement

In enterprise software engineering, test automation teams frequently stitch together a fragmented constellation of standalone tools:
- **Postman / k6** for API verification and quick load tests.
- **Playwright / Cypress** for browser UI tests.
- **TestRail / Xray** for organizing test cases and tracking coverage.
- **Allure / ExtentReports** for generating HTML report artifacts.
- **Faker.js scripts** for seeding test databases.
- **Jira / GitHub** for filing manual bug reports when automated tests fail.

### The Problem: Tool Fragmentation & High Overhead
1. **Data Silos**: Test results live in ephemeral HTML files or separate SaaS dashboards.
2. **Context Switching**: QA engineers maintain disparate configs, assertion syntaxes, and credential stores.
3. **Flaky Test Blindness**: Standard CI runners mark retried tests as "passed", hiding flakiness until production issues occur.
4. **Maintenance Burden**: High cost of integrating disparate vendor APIs and managing multiple licensing tiers.

---

## 2. The Solution: QATOOL Consolidated Architecture

To demonstrate that modern test automation can be streamlined into a cohesive, high-performance platform, I engineered **QATOOL** as a TypeScript monorepo that consolidates these 5 critical categories:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               QATOOL UNIFIED PLATFORM                                   │
├───────────────────┬───────────────────┬───────────────────┬─────────────────────────────┤
│ 1. API & LOAD     │ 2. BROWSER UI     │ 3. TEST MANAGEMENT│ 4. REPORTING & TRENDS       │
│ • Custom fetch    │ • Playwright-Core │ • Tag Catalog     │ • Next.js 15 App Router     │
│ • {{token}} chain │ • Opinionated DSL │ • Stability Index │ • Recharts Pass-Rate Timeline│
│ • p50/p95 Load Run│ • Auto-Screenshot │ • History Dots    │ • Flaky Test Leaderboard    │
├───────────────────┴───────────────────┴───────────────────┴─────────────────────────────┤
│ 5. AUXILIARY TOOLING: Data Generator (@faker-js) + GitHub Bug Deduplicator (@octokit)   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deep-Dive: Core Technical Implementations

### 3.1 Custom Step Executor Architecture (`@qatool/core`)
Instead of hardcoding what a test can execute, `@qatool/core` defines a clean `StepExecutor` interface:

```typescript
export interface StepExecutor {
  canHandle(action: string): boolean;
  execute(stepId: string, stepName: string, action: string, payload: unknown, context: { runId: string }): Promise<StepResult>;
  teardownCase?(context: { runId: string }): Promise<void>;
}
```

This decoupled architecture allows the runner to dispatch `http.request`, `http.concurrent`, or `browser.step` dynamically to their respective package engines while keeping the `RunReport` and PostgreSQL schema completely unified.

---

### 3.2 Dynamic Variable Chaining in API Testing (`@qatool/api-engine`)
In multi-step API flows (e.g., Auth Login $\rightarrow$ User Creation $\rightarrow$ Resource Access), state must flow seamlessly.

QATOOL implements an isolated in-memory `VariableStore` per test case with recursive string interpolation:
- **Dot-Notation Path Extractor**: `extractPath(res.body, "data.tokens[0].accessToken")` safely navigates nested objects and arrays.
- **Deep Interpolator**: Automatically replaces `{{token}}` within URLs, request headers, JSON bodies, and query parameters before execution.

---

### 3.3 Stand-in Concurrent Load Runner (p50 / p90 / p95 / p99)
Rather than launching heavy external load generators like JMeter for baseline performance checks, `@qatool/api-engine` provides a built-in concurrent load runner:

```typescript
// Algorithm: Semaphore-bounded concurrent firing with percentile calculations
const sorted = [...latencies].sort((a, b) => a - b);
const p50 = sorted[Math.floor(0.50 * sorted.length)];
const p95 = sorted[Math.floor(0.95 * sorted.length)];
const p99 = sorted[Math.floor(0.99 * sorted.length)];
```

This can be triggered via CLI (`qatool load --url=... --count=50 --concurrency=10`) or embedded directly as an assertion step (`maxP95Ms: 500`) in regular test suites.

---

### 3.4 Playwright-Core Driver with Opinionated DSL (`@qatool/ui-engine`)
Instead of wrapping heavy high-level test runners, `@qatool/ui-engine` drives Chromium using `playwright-core` with an opinionated, lightweight DSL:
- Auto-waits on element visibility before clicking or typing.
- Captures failure screenshots automatically upon assertion error.
- Enforces fresh browser context isolation per test case to avoid state leakage.

---

### 3.5 Flaky Test Heuristics & Leaderboard
Standard test frameworks mask flakiness by reporting a test as "Passed" if retry attempt 2 succeeds.

QATOOL categorizes execution outcomes into a 3-tier classification:
1. **CLEAN PASS**: Passed on attempt 1.
2. **FLAKY**: Failed on attempt 1, but succeeded on retry attempt $\ge 2$. Logged with `flaky: true` and `attempts: N`.
3. **HARD FAILURE**: Failed on all $N$ allowed retry attempts.

These metrics feed into the **Flaky Test Leaderboard** on the dashboard, giving QA and engineering teams actionable insights into unstable endpoints or race conditions.

---

### 3.6 Automated GitHub Bug Filing with Deduplication (`@qatool/integrations`)
When tests fail in CI/CD, creating duplicate bug tickets creates noise. 

`@qatool/integrations` uses `@octokit/rest` with intelligent deduplication:
1. Queries the target GitHub repository for open issues labeled `automated-test-failure`.
2. Matches on test case name or ID.
3. **If an issue is already open**: Appends a run failure comment with the latest run ID and error message.
4. **If no open issue exists**: Creates a new GitHub issue with full markdown tables, failed step stack traces, and assertion diffs.

---

## 4. Engineering Impact & Portfolio Value

| Challenge | Traditional Approach | QATOOL Solution |
|---|---|---|
| **Test Setup & Execution** | Separate Postman CLI, Playwright runner, k6 script | Single `qatool run` or `qatool load` CLI command |
| **Test Data Creation** | Manual CSV editing or standalone script | Built-in `qatool gen` command (JSON, CSV, Table) |
| **Bug Tracking** | Manual Jira copy-paste of stack traces | Auto GitHub Issue sync with deduplication |
| **Telemetry & Reporting** | Ephemeral HTML files / JUnit XML | Relational PostgreSQL database + Next.js 15 Web Dashboard |

Building QATOOL demonstrates full-stack proficiency in **TypeScript architecture, systems design, concurrency control, browser drivers, relational data modeling, and modern UI engineering**.
