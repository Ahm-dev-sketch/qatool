# ⚡ QATOOL (v2) — Unified QA Automation Platform

> A consolidated, self-built QA automation monorepo replacing 5 separate tool categories — **Postman** (API Testing & Load Benchmarking), **Playwright** (Browser/UI Automation with Custom DSL), **TestRail** (Test Case Management & Explorer), **Allure** (Next.js Trends & Reporting Dashboard), **Faker** (Test Data Generation), and **Jira** (GitHub Issue Auto-Creation with Deduplication) — in one unified TypeScript platform.

---

## 🎯 The Vision: 5 Tools Consolidated into One Platform

Instead of stitching together half a dozen fragmented tools with separate licenses, config files, and data silos, **QATOOL** unifies the core daily responsibilities of a QA Automation Engineer:

| Category | Replaced Industry Tool | QATOOL Implementation |
|---|---|---|
| **1. API Testing & Load** | Postman / Newman / k6 | `@qatool/api-engine` — HTTP client, `{{token}}` variable chaining, and concurrent p50/p95 load runner |
| **2. Browser / UI Testing** | Playwright / Cypress | `@qatool/ui-engine` — `playwright-core` driver with custom opinionated DSL & auto-screenshot capture |
| **3. Test Case Management** | TestRail / Xray | `@qatool/core` + `apps/dashboard/app/explorer` — test catalog, tag organization, and stability index |
| **4. Reporting & Trends** | Allure / ExtentReports | `apps/dashboard` — Next.js 15 + Tailwind + shadcn/ui dashboard with pass rate & latency trends |
| **5. Data Gen & Bug Tracking** | Faker.js + Jira | `@qatool/data-gen` (CLI fixture generator) + `@qatool/integrations` (GitHub Issue deduplicator) |

---

## 🏛️ Monorepo System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLI LAYER (`apps/cli`)                                │
│        qatool run --suite=./tests    │   qatool load --url=<url>   │   qatool gen users     │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CORE ENGINE (`packages/core`)                               │
│  ┌────────────────────────┐    ┌─────────────────────────┐    ┌──────────────────────────┐  │
│  │ Test Discovery (Glob)  │    │ Semaphore Orchestrator  │    │ Retry & Flaky Detector   │  │
│  └────────────────────────┘    └─────────────────────────┘    └──────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Custom Assertion Engine (toEqual, toContain, toBeStatus, toHaveText, toBeGreaterThan) │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────┬───────────────────────────────┬──────────────┘
               │                               │                               │
               ▼                               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌───────────────────────────┐
│     API ENGINE MODULE        │ │       UI ENGINE MODULE       │ │      AUXILIARY TOOLS      │
│  (`packages/api-engine`)     │ │     (`packages/ui-engine`)   │ │                           │
│                              │ │                              │ │  • Test Data Generator    │
│ • Raw HTTP Client            │ │ • `playwright-core` Driver   │ │    (`packages/data-gen`)  │
│ • Variable Store & Chaining  │ │ • Custom Opinionated DSL     │ │    Users, Products, TXNs  │
│ • API Assertions & Latency   │ │ • DOM Element & Text Asserts │ │                           │
│ • Concurrent Load Benchmark  │ │ • Auto Failure Screenshot    │ │  • GitHub Issue Creator   │
│   (p50, p90, p95, p99, RPS)  │ │ • Isolated Context Lifecycle │ │    (`@qatool/integrations`)│
│                              │ │                              │ │    Deduplicated Auto-Bug  │
└──────────────┬───────────────┘ └─────────────┬────────────────┘ └─────────────┬─────────────┘
               │                               │                                │
               └───────────────────────────────┼────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PERSISTENCE LAYER (PostgreSQL)                              │
│                   Prisma 7 ORM with pg Driver Adapter (Shared `qatool_db`)                  │
│             [TestRun] ──1:N──> [TestCase] ──1:N──> [TestStep] ──1:N──> [AssertionResult]    │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            REPORTING DASHBOARD (`apps/dashboard`)                           │
│                (Next.js 15 App Router + Tailwind CSS + shadcn-admin UI System)              │
│                                                                                             │
│ • Run List: High-level KPIs, pass rate, failure counts, and execution duration              │
│ • Run Details: Step drilldown, assertion comparator (`expected` vs `actual`), screenshot view│
│ • Trends & Analytics: Recharts Pass Rate % timeline, duration history, and Flaky Leaderboard│
│ • Test Explorer: TestRail-style test catalog, tag filters, and recent execution status dots │
│ • Internal Auth: NextAuth credentials protection                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Monorepo Structure

```
automation/
├── packages/
│   ├── core/                  # Test definitions, runner, assertion library, retry & DB persistence
│   ├── api-engine/            # HTTP client, variable chaining {{token}}, API assertions, Concurrent Load Runner
│   ├── ui-engine/             # Playwright-core driver, custom UI DSL, auto-screenshot capture
│   ├── data-gen/              # Faker-based mock test data generator (Users, Products, TXNs, Custom)
│   └── integrations/          # GitHub Issue auto-creation with smart deduplication
├── apps/
│   ├── cli/                   # qatool binary CLI (commands: run, load, gen)
│   └── dashboard/             # Next.js 15 reporting dashboard (shadcn-admin UI)
├── prisma/                    # Shared PostgreSQL schema and migrations
├── tests/                     # Test definitions (*.test.ts)
├── CASE_STUDY.md              # Detailed engineering whitepaper & portfolio narrative
├── README.md                  # Project documentation
└── package.json               # Root workspaces configuration
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (listening on localhost:5432)
- Google Chrome or Chromium (installed on system)

### 1. Installation & Database Setup
```bash
# Clone and install dependencies across all workspaces
npm install

# Setup environment variables
cp .env.example .env
# Ensure DATABASE_URL is configured:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qatool_db"

# Run Prisma database migrations
npm run db:migrate
```

---

## 💻 CLI Commands & Usage

### 1. Run Test Suites
```bash
# Run all tests sequentially
npm test

# Run tests in parallel (3 workers) with 2x auto-retry on failure
npm run test:parallel

# Filter by tags
npx tsx apps/cli/src/index.ts run --suite=./tests --tags=smoke
npx tsx apps/cli/src/index.ts run --suite=./tests --tags=api
npx tsx apps/cli/src/index.ts run --suite=./tests --tags=ui

# Run with automated GitHub Issue creation on test failure
npx tsx apps/cli/src/index.ts run --suite=./tests --github-sync
```

### 2. Concurrent Load Benchmarking (Phase 2.6)
```bash
# Benchmark an endpoint with 50 requests (concurrency: 10)
npx tsx apps/cli/src/index.ts load --url=https://reqres.in/api/users --count=50 --concurrency=10
```
**Sample Output:**
```text
  ⚡ CONCURRENT LOAD RUNNER REPORT
────────────────────────────────────────────────────────────
  Target URL   : GET https://reqres.in/api/users
  Requests     : 50 total (Concurrency: 10)
  Duration     : 0.98s (980ms)
  Throughput   : 51.02 req/sec
  Success Rate : 100%
────────────────────────────────────────────────────────────
  Latency Distribution:
    p50 (Median): 62ms
    p90         : 210ms
    p95         : 340ms
    p99         : 420ms
    Min / Max   : 41ms / 420ms (Avg: 118ms)
────────────────────────────────────────────────────────────
  Status Codes : 200: 50
────────────────────────────────────────────────────────────
```

### 3. Test Data Generator (Phase 4.5)
```bash
# Generate 10 fake users in JSON format
npx tsx apps/cli/src/index.ts gen users --count=10 --format=json

# Generate 20 products in CSV format
npx tsx apps/cli/src/index.ts gen products --count=20 --format=csv

# Generate 15 transactions in terminal table format
npx tsx apps/cli/src/index.ts gen transactions --count=15 --format=table

# Generate custom mock schema
npx tsx apps/cli/src/index.ts gen custom --fields="fullName:name,role:string,salary:float" --count=5
```

---

## 🖥️ Reporting Dashboard (Next.js 15)

```bash
npm run dashboard
```
Open **[http://localhost:3000](http://localhost:3000)**  
- **Username**: `admin`
- **Password**: `admin123`

### Dashboard Pages:
1. **Overview & Runs (`/`)**: High-level KPIs, filterable test runs table, pass rate stats.
2. **Run Details (`/runs/[id]`)**: Step-by-step assertion inspection and failed UI step screenshot previews.
3. **Trends & Stability (`/trends`)**: Recharts pass-rate timeline, duration trends, and **Flaky Test Leaderboard**.
4. **Test Case Explorer (`/explorer`)**: Searchable catalog of test cases with stability indices and history dots.

---

## 📄 License
MIT © 2026 QATOOL Contributors
