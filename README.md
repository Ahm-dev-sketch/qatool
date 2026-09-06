# ⚡ QATOOL — Custom QA Test Automation Engine & Dashboard

> A self-built, zero-dependency test automation platform covering **API testing** and **Browser/UI testing**, engineered from lower-level primitives: raw HTTP client for API tests, direct **Chrome DevTools Protocol (CDP)** for browser automation (zero Playwright / Selenium / Cypress public APIs), and a full Next.js reporting dashboard.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLI LAYER                                         │
│                      qatool run --suite=./tests [--parallel=N] [--retries=N]            │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE TEST RUNNER                                      │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌──────────────────────────┐  │
│  │ Test Discovery (Glob) │   │ Semaphore Orchestrator │   │ Retry & Flaky Detector   │  │
│  └───────────────────────┘   └────────────────────────┘   └──────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Custom Assertion Engine (toEqual, toContain, toBeStatus, toHaveText, isVisible)  │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────────┬───────────────────┘
                        │                                             │
                        ▼                                             ▼
┌──────────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│              API TESTING ENGINE              │ │           BROWSER / UI ENGINE          │
│                                              │ │         (Raw CDP via DevTools)         │
│  • Raw fetch / undici HTTP client            │ │                                        │
│  • GET, POST, PUT, DELETE, PATCH             │ │  • Headless Chrome Child Process       │
│  • Dynamic {{variable}} interpolation        │ │  • WebSocket CDP Connection (:9222)    │
│  • Response payload extraction & chaining    │ │  • Page Domain (navigate, screenshots) │
│  • Latency & Status & Schema Assertions      │ │  • DOM + Input Domains (click, type)   │
│                                              │ │  • Runtime Domain (JS evaluation)      │
└───────────────────────┬──────────────────────┘ └────────────────────┬───────────────────┘
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PERSISTENCE LAYER                                     │
│                Prisma 7 ORM (Driver Adapter: pg) ➔ PostgreSQL (qatool_db)                │
│             [TestRun] ──1:N──> [TestCase] ──1:N──> [TestStep] ──1:N──> [AssertionResult]│
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                NEXT.JS REPORTING DASHBOARD                              │
│                      (Next.js 15 App Router + Tailwind CSS + Recharts)                   │
│                                                                                         │
│  • Run List View (KPIs, Pass/Fail counts, execution timeline)                           │
│  • Run Detail View (Step-by-step drilldown, assertion logs, failure screenshots)        │
│  • Trends & Analytics (Pass rate % over time, latency graphs, flaky test leaderboard)   │
│  • Test Case Explorer (Catalog of test cases, reliability metrics, run history)         │
│  • NextAuth Credentials Authentication                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Why This Was Built From Scratch

Most test automation engineers know how to call `page.click()` or `page.goto()` in Playwright or Cypress. However, high-level frameworks abstract away the crucial protocol and browser mechanics.

Building an automation engine from first principles provides direct mastery of:
1. **Chrome DevTools Protocol (CDP)**: Direct control over browser domains (`Page`, `DOM`, `Runtime`, `Input`, `Network`) over WebSockets.
2. **Variable Chaining**: Extracting dynamic tokens and state across requests without external state-management libraries.
3. **Flaky Test Heuristics**: Automatic retry orchestration that differentiates true passes, intermittent flakiness, and hard failures.
4. **Resilient Architecture**: Designing a decoupled engine where test definitions, runners, execution modules, and dashboards communicate through typed contracts.

---

## 🚀 Key Features

### 1. Type-Safe Test DSL (`defineTest`)
Declare tests using pure TypeScript with strict type inference:

```typescript
import { defineTest } from "../src/core/define.js";

export default defineTest({
  id: "tc-api-001",
  name: "API Login and Protected Access",
  type: "api",
  tags: ["smoke", "api"],
  steps: [
    {
      id: "s1",
      name: "POST /api/login — extract token",
      action: "http.request",
      payload: {
        method: "POST",
        url: "https://api.example.com/login",
        body: { email: "user@example.com", password: "secretpassword" },
        extract: { token: "data.token" }, // Stores in variable pool
        assertions: [
          { id: "a1", type: "status", expected: 200 },
          { id: "a2", type: "latency", maxMs: 1500 },
        ],
      },
    },
    {
      id: "s2",
      name: "GET /api/profile — authenticated with {{token}}",
      action: "http.request",
      payload: {
        method: "GET",
        url: "https://api.example.com/profile",
        headers: { Authorization: "Bearer {{token}}" }, // Dynamic interpolation
        assertions: [
          { id: "a3", type: "status", expected: 200 },
          { id: "a4", type: "jsonPath", path: "data.id", expected: 42 },
        ],
      },
    },
  ],
  assertions: [],
});
```

### 2. Browser Testing via Raw CDP (Zero Playwright)
Automate headless Chrome directly over CDP WebSockets:

```typescript
export default defineTest({
  id: "tc-ui-001",
  name: "Web Portal Navigation and Assertions",
  type: "ui",
  tags: ["ui", "smoke"],
  steps: [
    {
      id: "s1",
      name: "Navigate and verify elements",
      action: "browser.step",
      payload: {
        actions: [
          { action: "navigate", url: "https://example.com" },
          { action: "assertElementExists", selector: "h1" },
          { action: "assertIsVisible", selector: "h1" },
          { action: "assertTextContains", selector: "h1", expected: "Example Domain" },
        ],
      },
    },
  ],
  assertions: [],
});
```

- Automatic **failure screenshot capture** on test failure (`screenshots/<runId>/<stepId>.png`).
- DOM coordinate calculation via `DOM.getBoxModel` for natural mouse click simulation via `Input.dispatchMouseEvent`.

### 3. Orchestration & Flaky Detection
- **Parallel Execution**: `--parallel=<N>` uses a non-blocking semaphore queue to run test cases concurrently.
- **Smart Retries**: `--retries=<N>` automatically re-runs failed cases. If a test succeeds on attempt 2+, it is categorized as `FLAKY` in the database and terminal summary.

### 4. Next.js Reporting Dashboard
- **Run List**: High-level execution metrics, pass rates, and suite duration.
- **Run Detail**: Per-step log viewer, assertion comparator (`expected` vs `actual`), and failure screenshot previews.
- **Trends & Analytics**: Interactive Recharts graphs for pass rate trends and duration over time, plus a **Flaky Test Leaderboard**.
- **Test Case Explorer**: Catalog of all registered test cases with stability indices.

---

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (e.g. running locally on port 5432)
- Google Chrome (installed on the host machine)

### 1. Installation
```bash
# Clone & install engine dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qatool_db"

# Run Prisma database migration
npx prisma migrate dev
```

### 2. Running Test Suites via CLI
```bash
# Run all tests sequentially
npx tsx src/cli/index.ts run --suite=./tests

# Run tests in parallel with 3 workers
npx tsx src/cli/index.ts run --suite=./tests --parallel=3

# Run with retry on failure (flaky detection)
npx tsx src/cli/index.ts run --suite=./tests --retries=2

# Filter by tags
npx tsx src/cli/index.ts run --suite=./tests --tags=smoke
npx tsx src/cli/index.ts run --suite=./tests --tags=api
npx tsx src/cli/index.ts run --suite=./tests --tags=ui
```

### 3. Starting the Dashboard
```bash
cd dashboard
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** and sign in:
- **Username**: `admin`
- **Password**: `admin123`

---

## 📂 Project Structure

```
automation/
├── src/
│   ├── api/                  # API Engine (HTTP client, variable store, assertions)
│   ├── browser/              # CDP Browser Engine (launcher, page, elements, assertions)
│   ├── cli/                  # CLI parser, entrypoint, ANSI printer
│   ├── core/                 # Runner, types, DSL define, retry & orchestrator
│   └── db/                   # Prisma 7 persistence layer (Driver Adapter)
├── prisma/
│   ├── schema.prisma         # TestRun, TestCase, TestStep, AssertionResult
│   └── migrations/           # PostgreSQL migration history
├── tests/                    # Test suites (*.test.ts)
├── dashboard/                # Next.js 15 Reporting Dashboard
│   ├── app/                  # App Router pages (/runs, /trends, /explorer, /login)
│   ├── components/           # UI cards, tables, charts (Recharts)
│   └── lib/                  # Database connection, auth options, utils
├── screenshots/              # Failure screenshots captured during UI runs
├── CASE_STUDY.md             # Technical deep-dive on CDP & engine internals
├── README.md                 # Project documentation
└── package.json
```

---

## 📄 License
MIT © 2026 QATOOL Contributors
