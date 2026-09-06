# 📘 Engineering Case Study: Why I Built a QA Automation Engine from Scratch

**Author**: Senior QA & Test Automation Engineer  
**Project**: QATOOL (Custom API & CDP Browser Automation Platform)  
**Stack**: TypeScript, Node.js, Chrome DevTools Protocol (CDP), Prisma 7, PostgreSQL, Next.js 15, Tailwind CSS

---

## 1. Executive Summary

Modern test automation often revolves around using high-level frameworks like Playwright, Cypress, or Selenium. While these tools are powerful, they abstract away the underlying mechanics of how browsers and HTTP runtimes actually operate.

To develop deep domain expertise in browser protocols, network execution, and test orchestration, I engineered **QATOOL** from the ground up:
1. **Zero High-Level Test Framework Dependencies**: No Jest, Mocha, Chai, Playwright, or Cypress libraries.
2. **Raw Chrome DevTools Protocol (CDP) Control**: Controlling Chrome via WebSockets directly using native protocol domains (`Page`, `DOM`, `Runtime`, `Input`, `Network`).
3. **Dynamic Variable Chaining**: Chaining API tokens across multiple requests via custom memory stores and recursive string interpolation (`{{token}}`).
4. **Flaky Test Heuristics & Parallel Orchestration**: Multi-attempt retry loops that distinguish true failures from transient flakiness.
5. **Unified Reporting Dashboard**: A full-stack Next.js dashboard backed by PostgreSQL to monitor test health, trends, and failure screenshots.

---

## 2. Technical Deep-Dive: Under the Hood of Browser Automation

### 2.1 The CDP Architecture
High-level tools like Playwright and Puppeteer operate by communicating with Chromium over the Chrome DevTools Protocol. Instead of relying on their pre-packaged APIs, QATOOL connects directly to the Chrome debugging port:

```
[QATOOL Engine]
       │  (WebSocket ws://localhost:9222/devtools/page/...)
       ▼
[Chrome DevTools Protocol Daemon]
   ├── Page Domain      ➔ Page.navigate, Page.loadEventFired, Page.captureScreenshot
   ├── DOM Domain       ➔ DOM.getDocument, DOM.querySelector, DOM.getBoxModel
   ├── Runtime Domain   ➔ Runtime.evaluate (Execute JavaScript in V8 context)
   └── Input Domain     ➔ Input.dispatchMouseEvent, Input.dispatchKeyEvent
```

### 2.2 Re-implementing `click()` without High-Level Abstractions
In Playwright, `await page.click('button')` is a single line. Under the hood, the browser must find the element, calculate its physical viewport coordinates, and dispatch hardware-level mouse events.

In QATOOL, I implemented this sequence explicitly in `src/browser/elements.ts`:
1. **DOM Resolution**: Query the root DOM node ID via `DOM.getDocument({ depth: 0 })`.
2. **Selector Querying**: Locate the element's node ID using `DOM.querySelector({ nodeId, selector })`.
3. **Bounding Quad Calculation**: Retrieve the element's bounding geometry using `DOM.getBoxModel({ nodeId })`. The protocol returns an 8-point polygon quad `[x1, y1, x2, y1, x2, y2, x1, y2]`.
4. **Center Point Calculation**: Calculate the center $(X, Y)$ coordinate:
   $$\text{center}_X = \frac{x_1 + x_2}{2}, \quad \text{center}_Y = \frac{y_1 + y_2}{2}$$
5. **Event Dispatching**: Dispatch `mousePressed` and `mouseReleased` events through `Input.dispatchMouseEvent`.

```typescript
// Excerpt from QATOOL's element click engine:
const { model } = await DOM.getBoxModel({ nodeId });
const [x1, y1, x2, , , y2] = model.content;
const x = Math.round((x1 + x2) / 2);
const y = Math.round((y1 + y2) / 2);

await Input.dispatchMouseEvent({ type: "mousePressed", x, y, button: "left", clickCount: 1 });
await Input.dispatchMouseEvent({ type: "mouseReleased", x, y, button: "left", clickCount: 1 });
```

### 2.3 Waiting Strategies & Flakiness Prevention
In raw CDP, there is no automatic `waitForSelector`. If a script queries the DOM before an element has rendered, the call fails immediately.

To solve this, QATOOL implements an asynchronous polling loop evaluated in the page's V8 context:
```typescript
export async function waitForSelector(client: CDP.Client, selector: string, timeoutMs = 10000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await client.Runtime.evaluate({
      expression: `!!document.querySelector(${JSON.stringify(selector)})`,
      returnByValue: true,
    });
    if (res.result.value === true) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`waitForSelector("${selector}") timed out after ${timeoutMs}ms`);
}
```

---

## 3. API Engine: Dynamic Chaining & Variable Store

In real-world end-to-end tests, API requests rarely happen in isolation. A standard flow requires logging in, extracting a bearer token from the JSON response body, and injecting it into subsequent headers.

### 3.1 The Variable Store & Resolver
QATOOL implements an isolated in-memory `VariableStore` per test case:
- **Path Extraction**: Uses dot-notation string parsing (`extractPath(res.body, "data.user.token")`) to safely traverse deep JSON payloads.
- **Deep Interpolation**: Uses recursive pattern replacement (`/\{\{(\w+)\}\}/g`) across request URLs, headers, bodies, and query parameters before dispatching requests.

---

## 4. Test Orchestration & Flaky Detection

A critical problem in modern CI/CD pipelines is test flakiness (tests that fail intermittently due to network jitter, CPU spikes, or asynchronous race conditions).

### 4.1 Flaky Classification Algorithm
QATOOL implements an explicit multi-attempt retry wrapper (`src/core/retry.ts`):

```
                       ┌──────────────────────┐
                       │  Execute Test Run    │
                       └──────────┬───────────┘
                                  │
                       ┌──────────▼───────────┐
                       │   Did test pass?     │
                       └────┬────────────┬────┘
                        YES │            │ NO
                            │            │
            ┌───────────────▼┐          ┌▼──────────────────────┐
            │ Was attempt > 1?│          │ Are retries remaining?│
            └────┬───────┬───┘          └────┬──────────────┬───┘
             YES │       │ NO            YES │              │ NO
                 │       │                   │              │
      ┌──────────▼───┐  ┌▼────────────┐ ┌────▼────────┐  ┌──▼───────────┐
      │ Flag: FLAKY  │  │ Flag: PASS  │ │ Re-execute  │  │ Flag: FAILED │
      │ (Unstable)   │  │ (Clean)     │ │ (Attempt N) │  │ (Hard Fail)  │
      └──────────────┘  └─────────────┘ └─────────────┘  └──────────────┘
```

This prevents flaky tests from polluting pass rates or getting masked as clean passes. The dashboard exposes a **Flaky Test Leaderboard** that highlights tests with high variance.

---

## 5. Key Takeaways & Engineering Value

Building this toolkit established several foundational engineering insights:
1. **CDP Domain Separation**: Clear boundaries between execution (`Runtime`), presentation (`DOM`), interaction (`Input`), and lifecycle (`Page`).
2. **Decoupled Architecture**: Separating the test runner from the execution modules allows new testing drivers (e.g. gRPC, WebSocket tests, Mobile CDP) to be plugged in effortlessly.
3. **Production Readiness**: Persisting structured telemetry directly to PostgreSQL unlocks rich reporting capabilities that file-based JUnit XML cannot match.

---

## 6. How to Reference in Technical Interviews

- **Topic**: *"How do browser automation frameworks work under the hood?"*  
  **Narrative**: Explain the CDP WebSocket connection, domain enabling (`DOM`, `Runtime`, `Page`, `Input`), bounding box calculation, and event loop synchronization.
- **Topic**: *"How do you handle flaky tests in large suites?"*  
  **Narrative**: Discuss the distinction between blind retries and retry classification with flaky heuristics and leaderboard tracking.
