import 'dotenv/config';

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestOptions {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: BearerAuth | BasicAuth;
  queryParams?: Record<string, string>;
  timeoutMs?: number;
}

export interface BearerAuth {
  type: "bearer";
  token: string;
}

export interface BasicAuth {
  type: "basic";
  username: string;
  password: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;           // parsed JSON or raw string
  latencyMs: number;
  url: string;
}

// ── URL builder ───────────────────────────────────────────────────────────────

function buildUrl(base: string, queryParams?: Record<string, string>): string {
  if (!queryParams || Object.keys(queryParams).length === 0) return base;
  const url = new URL(base);
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

// ── Auth header builder ───────────────────────────────────────────────────────

function buildAuthHeader(auth?: BearerAuth | BasicAuth): string | undefined {
  if (!auth) return undefined;
  if (auth.type === "bearer") {
    return `Bearer ${auth.token}`;
  }
  if (auth.type === "basic") {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
    return `Basic ${encoded}`;
  }
  return undefined;
}

// ── Core request function ─────────────────────────────────────────────────────

export async function request(options: RequestOptions): Promise<HttpResponse> {
  const { method, body, auth, queryParams, timeoutMs = 30_000 } = options;

  const url = buildUrl(options.url, queryParams);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const authHeader = buildAuthHeader(auth);
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  };

  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    init.body = JSON.stringify(body);
  }

  const start = Date.now();
  const res = await fetch(url, init);
  const latencyMs = Date.now() - start;

  // Parse response headers
  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // Parse body — try JSON first, fall back to text
  const contentType = res.headers.get("content-type") ?? "";
  let parsedBody: unknown;
  if (contentType.includes("application/json")) {
    parsedBody = await res.json();
  } else {
    parsedBody = await res.text();
  }

  return {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
    body: parsedBody,
    latencyMs,
    url,
  };
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const http = {
  get: (url: string, opts?: Omit<RequestOptions, "method" | "url">) =>
    request({ method: "GET", url, ...opts }),

  post: (url: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "url" | "body">) =>
    request({ method: "POST", url, body, ...opts }),

  put: (url: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "url" | "body">) =>
    request({ method: "PUT", url, body, ...opts }),

  patch: (url: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "url" | "body">) =>
    request({ method: "PATCH", url, body, ...opts }),

  delete: (url: string, opts?: Omit<RequestOptions, "method" | "url">) =>
    request({ method: "DELETE", url, ...opts }),
};