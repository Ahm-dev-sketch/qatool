import type { AssertionDef, AssertionResult } from "./types.js";

export class AssertionError extends Error {
  constructor(
    public readonly expected: unknown,
    public readonly actual: unknown,
    message: string
  ) {
    super(message);
    this.name = "AssertionError";
  }
}

// ── Individual assertion functions ────────────────────────────────────────────

export function toEqual(actual: unknown, expected: unknown): { pass: boolean; message: string } {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  return {
    pass,
    message: pass
      ? `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`
      : `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}, but it did not`,
  };
}

export function toContain(actual: unknown, expected: unknown): { pass: boolean; message: string } {
  let pass = false;
  if (typeof actual === "string" && typeof expected === "string") {
    pass = actual.includes(expected);
  } else if (Array.isArray(actual)) {
    pass = actual.some((item) => JSON.stringify(item) === JSON.stringify(expected));
  }
  return {
    pass,
    message: pass
      ? `Expected value to contain ${JSON.stringify(expected)}`
      : `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}, but it did not`,
  };
}

export function toBeStatus(actual: unknown, expected: unknown): { pass: boolean; message: string } {
  const pass = actual === expected;
  return {
    pass,
    message: pass
      ? `Expected HTTP status ${actual}`
      : `Expected HTTP status ${expected}, got ${actual}`,
  };
}

export function toHaveText(actual: unknown, expected: unknown): { pass: boolean; message: string } {
  const pass =
    typeof actual === "string" &&
    typeof expected === "string" &&
    actual.includes(expected);
  return {
    pass,
    message: pass
      ? `Expected text to contain "${expected}"`
      : `Expected "${actual}" to contain "${expected}", but it did not`,
  };
}

export function toBeGreaterThan(actual: unknown, expected: unknown): { pass: boolean; message: string } {
  const pass = typeof actual === "number" && typeof expected === "number" && actual > expected;
  return {
    pass,
    message: pass
      ? `Expected ${actual} > ${expected}`
      : `Expected ${actual} to be greater than ${expected}, but it was not`,
  };
}

export function toBeTruthy(actual: unknown): { pass: boolean; message: string } {
  const pass = Boolean(actual);
  return {
    pass,
    message: pass
      ? `Expected value to be truthy`
      : `Expected truthy value, got ${JSON.stringify(actual)}`,
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function runAssertion(def: AssertionDef): AssertionResult {
  let result: { pass: boolean; message: string };

  switch (def.type) {
    case "toEqual":
      result = toEqual(def.actual, def.expected);
      break;
    case "toContain":
      result = toContain(def.actual, def.expected);
      break;
    case "toBeStatus":
      result = toBeStatus(def.actual, def.expected);
      break;
    case "toHaveText":
      result = toHaveText(def.actual, def.expected);
      break;
    case "toBeGreaterThan":
      result = toBeGreaterThan(def.actual, def.expected);
      break;
    case "toBeTruthy":
      result = toBeTruthy(def.actual);
      break;
    default: {
      const exhaustive: never = def.type;
      result = { pass: false, message: `Unknown assertion type: ${exhaustive}` };
    }
  }

  return {
    id: def.id,
    stepId: def.stepId,
    type: def.type,
    expected: def.expected,
    actual: def.actual,
    ...result,
  };
}
