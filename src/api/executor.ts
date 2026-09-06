import { request, type HttpResponse } from "./http-client.js";
import {
  interpolate,
  interpolateDeep,
  setVariable,
  extractPath,
  resetStore,
} from "./interpolate.js";
import {
  assertStatus,
  assertJsonPath,
  assertJsonPathExists,
  assertHeader,
  assertLatency,
  assertBodyContains,
} from "./assertions.js";
import type { StepResult, AssertionResult } from "../core/types.js";

// ── Step payload types ────────────────────────────────────────────────────────

export type ApiAuth =
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string };

export interface ApiStepPayload {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: ApiAuth;
  queryParams?: Record<string, string>;
  timeoutMs?: number;
  /** Extract values from response body path and store in variable store */
  extract?: Record<string, string>; // { varName: "body.path.to.value" }
  /** Assertions to run against the response */
  assertions?: ApiAssertionSpec[];
}

export type ApiAssertionSpec =
  | { id: string; type: "status"; expected: number }
  | { id: string; type: "jsonPath"; path: string; expected: unknown }
  | { id: string; type: "jsonPathExists"; path: string }
  | { id: string; type: "header"; name: string; value?: string }
  | { id: string; type: "latency"; maxMs: number }
  | { id: string; type: "bodyContains"; substring: string };

// ── Assertion runner ──────────────────────────────────────────────────────────

function runApiAssertions(
  res: HttpResponse,
  specs: ApiAssertionSpec[],
  stepId: string,
): AssertionResult[] {
  return specs.map((spec): AssertionResult => {
    let result: { pass: boolean; message: string };

    switch (spec.type) {
      case "status":
        result = assertStatus(res, spec.expected);
        break;
      case "jsonPath":
        result = assertJsonPath(res, spec.path, spec.expected);
        break;
      case "jsonPathExists":
        result = assertJsonPathExists(res, spec.path);
        break;
      case "header":
        result = assertHeader(res, spec.name, spec.value);
        break;
      case "latency":
        result = assertLatency(res, spec.maxMs);
        break;
      case "bodyContains":
        result = assertBodyContains(res, spec.substring);
        break;
      default: {
        const exhaustive: never = spec;
        result = { pass: false, message: `Unknown assertion type: ${JSON.stringify(exhaustive)}` };
      }
    }

    return {
      id: spec.id,
      stepId,
      type: spec.type,
      expected: "expected" in spec ? spec.expected : undefined,
      actual: res.status, // representative; detailed in message
      ...result,
    };
  });
}

// ── Single step executor ──────────────────────────────────────────────────────

export async function executeApiStep(
  stepId: string,
  stepName: string,
  payload: ApiStepPayload,
): Promise<StepResult> {
  const start = Date.now();

  try {
    // Interpolate {{variables}} in url, headers, body
    const resolvedUrl = interpolate(payload.url);
    const resolvedBody = payload.body !== undefined ? interpolateDeep(payload.body) : undefined;
    const resolvedHeaders = payload.headers
      ? (interpolateDeep(payload.headers) as Record<string, string>)
      : undefined;

    // Resolve auth token interpolation
    let resolvedAuth = payload.auth;
    if (resolvedAuth?.type === "bearer") {
      resolvedAuth = { type: "bearer", token: interpolate(resolvedAuth.token) };
    }

    const res = await request({
      method: payload.method,
      url: resolvedUrl,
      headers: resolvedHeaders,
      body: resolvedBody,
      auth: resolvedAuth,
      queryParams: payload.queryParams,
      timeoutMs: payload.timeoutMs,
    });

    // Extract variables from response for chaining
    if (payload.extract) {
      for (const [varName, path] of Object.entries(payload.extract)) {
        const value = extractPath(res.body, path);
        if (value === undefined) {
          console.warn(`  ⚠ extract: path "${path}" returned undefined — variable "${varName}" not set`);
        } else {
          setVariable(varName, value);
        }
      }
    }

    // Run assertions
    const assertionSpecs = payload.assertions ?? [];
    const assertionResults = runApiAssertions(res, assertionSpecs, stepId);
    const allPass = assertionResults.every((a) => a.pass);
    const firstFailure = assertionResults.find((a) => !a.pass);

    return {
      id: stepId,
      name: stepName,
      status: allPass ? "pass" : "fail",
      durationMs: Date.now() - start,
      error: firstFailure?.message,
      assertions: assertionResults,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id: stepId,
      name: stepName,
      status: "fail",
      durationMs: Date.now() - start,
      error: message,
      assertions: [],
    };
  }
}

// ── Export reset for use by runner ────────────────────────────────────────────
export { resetStore };