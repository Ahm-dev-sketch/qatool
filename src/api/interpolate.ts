/**
 * Variable store + {{variable}} string interpolation.
 *
 * Enables chaining values across API test steps:
 *   - Step 1: login → extract response.body.token → store as "token"
 *   - Step 2: GET /users with Authorization: Bearer {{token}}
 */

export type VariableStore = Map<string, unknown>;

// ── Module-level store (shared across all steps in a test run) ────────────────

let store: VariableStore = new Map();

export function resetStore(): void {
  store = new Map();
}

export function setVariable(key: string, value: unknown): void {
  store.set(key, value);
}

export function getVariable(key: string): unknown {
  return store.get(key);
}

export function getStore(): VariableStore {
  return store;
}

// ── String interpolation ──────────────────────────────────────────────────────

/**
 * Replace all {{key}} placeholders in a string with values from the store.
 * Throws if a referenced variable is not in the store.
 */
export function interpolate(template: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (!store.has(key)) {
      throw new Error(`Variable "{{${key}}}" referenced but not set in store`);
    }
    return String(store.get(key));
  });
}

/**
 * Recursively interpolate all string values in an object/array/primitive.
 * Non-string values are returned as-is.
 */
export function interpolateDeep(value: unknown): unknown {
  if (typeof value === "string") {
    return interpolate(value);
  }
  if (Array.isArray(value)) {
    return value.map(interpolateDeep);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = interpolateDeep(v);
    }
    return result;
  }
  return value;
}

// ── JSON path extractor ───────────────────────────────────────────────────────

/**
 * Extract a value from a nested object using dot-notation path.
 * e.g. extractPath({ data: { token: "abc" } }, "data.token") → "abc"
 */
export function extractPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}