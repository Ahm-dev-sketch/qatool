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
import { runConcurrentRequests, type ConcurrentRequestOptions } from "./concurrent.js";
import type { StepResult, AssertionResult, StepExecutor } from "@qatool/core";

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
  extract?: Record<string, string>;
  assertions?: ApiAssertionSpec[];
}

export interface ApiConcurrentStepPayload extends ApiStepPayload {
  count: number;
  concurrency?: number;
  maxP95Ms?: number;
  minSuccessRate?: number;
}

export type ApiAssertionSpec =
  | { id: string; type: "status"; expected: number }
  | { id: string; type: "jsonPath"; path: string; expected: unknown }
  | { id: string; type: "jsonPathExists"; path: string }
  | { id: string; type: "header"; name: string; value?: string }
  | { id: string; type: "latency"; maxMs: number }
  | { id: string; type: "bodyContains"; substring: string };

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
      actual: res.status,
      ...result,
    };
  });
}

export async function executeApiStep(
  stepId: string,
  stepName: string,
  payload: ApiStepPayload,
): Promise<StepResult> {
  const start = Date.now();

  try {
    const resolvedUrl = interpolate(payload.url);
    const resolvedBody = payload.body !== undefined ? interpolateDeep(payload.body) : undefined;
    const resolvedHeaders = payload.headers
      ? (interpolateDeep(payload.headers) as Record<string, string>)
      : undefined;

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

export async function executeConcurrentStep(
  stepId: string,
  stepName: string,
  payload: ApiConcurrentStepPayload
): Promise<StepResult> {
  const start = Date.now();
  const assertionResults: AssertionResult[] = [];

  try {
    const resolvedUrl = interpolate(payload.url);
    const resolvedHeaders = payload.headers
      ? (interpolateDeep(payload.headers) as Record<string, string>)
      : undefined;

    const report = await runConcurrentRequests({
      url: resolvedUrl,
      method: payload.method,
      count: payload.count,
      concurrency: payload.concurrency ?? 5,
      headers: resolvedHeaders,
      body: payload.body,
      timeoutMs: payload.timeoutMs,
    });

    let allPass = true;
    let firstError: string | undefined;

    if (payload.maxP95Ms !== undefined) {
      const pass = report.latencyStats.p95 <= payload.maxP95Ms;
      const message = pass
        ? `p95 latency (${report.latencyStats.p95}ms) ≤ ${payload.maxP95Ms}ms`
        : `p95 latency (${report.latencyStats.p95}ms) exceeded threshold of ${payload.maxP95Ms}ms`;
      assertionResults.push({
        id: `${stepId}-p95`,
        stepId,
        type: "maxP95Ms",
        expected: payload.maxP95Ms,
        actual: report.latencyStats.p95,
        pass,
        message,
      });
      if (!pass) {
        allPass = false;
        firstError = message;
      }
    }

    if (payload.minSuccessRate !== undefined) {
      const pass = report.successRate >= payload.minSuccessRate;
      const message = pass
        ? `Success rate (${report.successRate}%) ≥ ${payload.minSuccessRate}%`
        : `Success rate (${report.successRate}%) below required threshold of ${payload.minSuccessRate}%`;
      assertionResults.push({
        id: `${stepId}-successRate`,
        stepId,
        type: "minSuccessRate",
        expected: payload.minSuccessRate,
        actual: report.successRate,
        pass,
        message,
      });
      if (!pass) {
        allPass = false;
        firstError = firstError || message;
      }
    }

    return {
      id: stepId,
      name: stepName,
      status: allPass ? "pass" : "fail",
      durationMs: Date.now() - start,
      error: firstError,
      assertions: assertionResults,
    };
  } catch (err) {
    return {
      id: stepId,
      name: stepName,
      status: "fail",
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      assertions: [],
    };
  }
}

export class ApiStepExecutor implements StepExecutor {
  canHandle(action: string): boolean {
    return action === "http.request" || action === "http.concurrent" || action === "http.load";
  }

  async execute(
    stepId: string,
    stepName: string,
    action: string,
    payload: unknown,
    _context: { runId: string }
  ): Promise<StepResult> {
    if (action === "http.concurrent" || action === "http.load") {
      return executeConcurrentStep(stepId, stepName, payload as ApiConcurrentStepPayload);
    }
    return executeApiStep(stepId, stepName, payload as ApiStepPayload);
  }

  async teardownCase(): Promise<void> {
    resetStore();
  }
}

export { resetStore };
