import { defineTest } from "@qatool/core";

export default defineTest({
  id: "tc-api-001",
  name: "API — Login → Token → Protected Endpoint (ReqRes.in)",
  type: "api",
  tags: ["smoke", "api"],
  steps: [
    {
      id: "s1",
      name: "POST /api/login — get token",
      action: "http.request",
      payload: {
        method: "POST",
        url: "https://reqres.in/api/login",
        body: {
          email: "eve.holt@reqres.in",
          password: "cityslicka",
        },
        extract: {
          token: "token",   // store response.body.token as {{token}}
        },
        assertions: [
          { id: "a1-1", type: "status", expected: 200 },
          { id: "a1-2", type: "jsonPathExists", path: "token" },
          { id: "a1-3", type: "latency", maxMs: 5000 },
        ],
      },
    },
    {
      id: "s2",
      name: "GET /api/users — list users (token extracted in s1)",
      action: "http.request",
      payload: {
        method: "GET",
        url: "https://reqres.in/api/users",
        // ReqRes.in is a read-only demo — token proves chaining worked; no auth header needed
        headers: { "x-token": "{{token}}" },  // pass token as custom header to prove interpolation
        queryParams: { page: "1" },
        assertions: [
          { id: "a2-1", type: "status", expected: 200 },
          { id: "a2-2", type: "jsonPathExists", path: "data" },
          { id: "a2-3", type: "jsonPath", path: "page", expected: 1 },
          { id: "a2-4", type: "latency", maxMs: 5000 },
        ],
      },
    },
    {
      id: "s3",
      name: "GET /api/users/2 — fetch single user",
      action: "http.request",
      payload: {
        method: "GET",
        url: "https://reqres.in/api/users/2",
        headers: { "x-token": "{{token}}" },
        assertions: [
          { id: "a3-1", type: "status", expected: 200 },
          { id: "a3-2", type: "jsonPath", path: "data.id", expected: 2 },
          { id: "a3-3", type: "jsonPath", path: "data.email", expected: "janet.weaver@reqres.in" },
          { id: "a3-4", type: "latency", maxMs: 5000 },
        ],
      },
    },
  ],
  assertions: [], // API assertions are inline in each step's payload
});