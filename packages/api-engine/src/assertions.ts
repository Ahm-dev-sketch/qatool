import type { HttpResponse } from "./http-client.js";
import { extractPath } from "./interpolate.js";

export interface ApiAssertionResult {
  pass: boolean;
  message: string;
}

export function assertStatus(res: HttpResponse, expected: number): ApiAssertionResult {
  const pass = res.status === expected;
  return {
    pass,
    message: pass
      ? `Status is ${expected}`
      : `Expected status ${expected}, got ${res.status} (${res.statusText})`,
  };
}

export function assertJsonPath(
  res: HttpResponse,
  path: string,
  expected: unknown,
): ApiAssertionResult {
  const actual = extractPath(res.body, path);
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  return {
    pass,
    message: pass
      ? `Body.${path} equals ${JSON.stringify(expected)}`
      : `Expected body.${path} to be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  };
}

export function assertJsonPathExists(res: HttpResponse, path: string): ApiAssertionResult {
  const actual = extractPath(res.body, path);
  const pass = actual !== undefined;
  return {
    pass,
    message: pass
      ? `Body.${path} exists`
      : `Expected body.${path} to exist, but it was undefined`,
  };
}

export function assertHeader(
  res: HttpResponse,
  headerName: string,
  expectedValue?: string,
): ApiAssertionResult {
  const actual = res.headers[headerName.toLowerCase()];
  if (expectedValue === undefined) {
    const pass = actual !== undefined;
    return {
      pass,
      message: pass
        ? `Header "${headerName}" is present`
        : `Expected header "${headerName}" to be present, but it was missing`,
    };
  }
  const pass = actual === expectedValue;
  return {
    pass,
    message: pass
      ? `Header "${headerName}" equals "${expectedValue}"`
      : `Expected header "${headerName}" to be "${expectedValue}", got "${actual}"`,
  };
}

export function assertLatency(res: HttpResponse, maxMs: number): ApiAssertionResult {
  const pass = res.latencyMs <= maxMs;
  return {
    pass,
    message: pass
      ? `Response time ${res.latencyMs}ms ≤ ${maxMs}ms`
      : `Response time ${res.latencyMs}ms exceeded threshold of ${maxMs}ms`,
  };
}

export function assertBodyContains(res: HttpResponse, substring: string): ApiAssertionResult {
  const body = typeof res.body === "string" ? res.body : JSON.stringify(res.body);
  const pass = body.includes(substring);
  return {
    pass,
    message: pass
      ? `Body contains "${substring}"`
      : `Expected body to contain "${substring}", but it did not`,
  };
}
