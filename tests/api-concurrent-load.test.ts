import { defineTest } from "@qatool/core";

export default defineTest({
  id: "tc-api-002",
  name: "API — Concurrent Request Load Benchmark (Phase 2.6)",
  type: "api",
  tags: ["api", "load", "performance"],
  steps: [
    {
      id: "s1",
      name: "Concurrent 15 requests to GET /api/users with latency threshold",
      action: "http.concurrent",
      payload: {
        method: "GET",
        url: "https://reqres.in/api/users",
        count: 15,
        concurrency: 5,
        maxP95Ms: 4000,
        minSuccessRate: 90,
      },
    },
  ],
  assertions: [],
});
