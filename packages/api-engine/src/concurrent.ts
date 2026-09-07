import { request, type RequestOptions, type HttpResponse } from "./http-client.js";
import { Semaphore } from "@qatool/core";

export interface ConcurrentRequestOptions extends Omit<RequestOptions, "url"> {
  url: string;
  count: number;         // Total number of requests to execute
  concurrency?: number;  // Max concurrent requests in flight (default: 5)
}

export interface LatencyDistribution {
  min: number;
  max: number;
  avg: number;
  p50: number; // Median
  p90: number;
  p95: number;
  p99: number;
}

export interface ConcurrentRunReport {
  url: string;
  method: string;
  totalRequests: number;
  concurrency: number;
  totalDurationMs: number;
  requestsPerSecond: number;
  latencyStats: LatencyDistribution;
  statusCodes: Record<string, number>;
  errorsCount: number;
  successRate: number; // 0 to 100
  latencies: number[];
}

function calculatePercentiles(latencies: number[]): LatencyDistribution {
  if (latencies.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avg = Math.round(sum / sorted.length);

  const getPercentile = (p: number): number => {
    const idx = Math.min(
      Math.floor((p / 100) * sorted.length),
      sorted.length - 1
    );
    return sorted[idx];
  };

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    p50: getPercentile(50),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
  };
}

/**
 * Execute N copies of an HTTP request concurrently and calculate latency distribution.
 * Stand-in for load testing / stress benchmark.
 */
export async function runConcurrentRequests(
  options: ConcurrentRequestOptions
): Promise<ConcurrentRunReport> {
  const {
    url,
    count,
    concurrency = 5,
    method = "GET",
    headers,
    body,
    auth,
    queryParams,
    timeoutMs,
  } = options;

  const semaphore = new Semaphore(concurrency);
  const latencies: number[] = [];
  const statusCodes: Record<string, number> = {};
  let errorsCount = 0;

  const startTime = Date.now();

  const tasks = Array.from({ length: count }, (_, idx) => async () => {
    await semaphore.acquire();
    try {
      const res = await request({
        method,
        url,
        headers,
        body,
        auth,
        queryParams,
        timeoutMs,
      });

      latencies.push(res.latencyMs);
      const code = String(res.status);
      statusCodes[code] = (statusCodes[code] || 0) + 1;
    } catch (err) {
      errorsCount++;
      const code = "ERR";
      statusCodes[code] = (statusCodes[code] || 0) + 1;
    } finally {
      semaphore.release();
    }
  });

  await Promise.all(tasks.map((task) => task()));

  const totalDurationMs = Date.now() - startTime;
  const requestsPerSecond = Number(
    ((count / (totalDurationMs / 1000))).toFixed(2)
  );
  const successfulCount = count - errorsCount;
  const successRate = Number(((successfulCount / count) * 100).toFixed(1));

  return {
    url,
    method,
    totalRequests: count,
    concurrency,
    totalDurationMs,
    requestsPerSecond,
    latencyStats: calculatePercentiles(latencies),
    statusCodes,
    errorsCount,
    successRate,
    latencies,
  };
}

/**
 * Format the concurrent load test report for terminal output.
 */
export function formatLoadReport(report: ConcurrentRunReport): string {
  const col = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    dim: "\x1b[2m",
  };

  const dim = (s: string) => `${col.dim}${s}${col.reset}`;
  const bold = (s: string) => `${col.bold}${s}${col.reset}`;
  const green = (s: string) => `${col.green}${s}${col.reset}`;
  const cyan = (s: string) => `${col.cyan}${s}${col.reset}`;
  const yellow = (s: string) => `${col.yellow}${s}${col.reset}`;

  const divider = dim("────────────────────────────────────────────────────────────");
  const stats = report.latencyStats;

  const statusList = Object.entries(report.statusCodes)
    .map(([code, cnt]) => `${code}: ${cnt}`)
    .join(", ");

  return [
    "",
    cyan(bold("  ⚡ CONCURRENT LOAD RUNNER REPORT")),
    divider,
    `  Target URL   : ${bold(report.method)} ${report.url}`,
    `  Requests     : ${report.totalRequests} total (Concurrency: ${report.concurrency})`,
    `  Duration     : ${(report.totalDurationMs / 1000).toFixed(2)}s (${report.totalDurationMs}ms)`,
    `  Throughput   : ${green(bold(`${report.requestsPerSecond} req/sec`))}`,
    `  Success Rate : ${report.successRate >= 95 ? green(`${report.successRate}%`) : yellow(`${report.successRate}%`)}`,
    divider,
    bold("  Latency Distribution:"),
    `    p50 (Median): ${stats.p50}ms`,
    `    p90         : ${stats.p90}ms`,
    `    p95         : ${stats.p95}ms`,
    `    p99         : ${stats.p99}ms`,
    `    Min / Max   : ${stats.min}ms / ${stats.max}ms (Avg: ${stats.avg}ms)`,
    divider,
    `  Status Codes : ${statusList}`,
    divider,
    "",
  ].join("\n");
}
