export type VariableStore = Map<string, unknown>;

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

export function interpolate(template: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (!store.has(key)) {
      throw new Error(`Variable "{{${key}}}" referenced but not set in store`);
    }
    return String(store.get(key));
  });
}

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
