import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/utils";
import { 
  Layers, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  History, 
  ArrowRight,
  Filter
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  // Fetch all test cases with their parent run details
  const cases = await db.testCase.findMany({
    orderBy: { run: { createdAt: "desc" } },
    include: {
      run: {
        select: {
          id: true,
          createdAt: true,
          suiteDir: true,
        },
      },
    },
  });

  // Group test cases by externalId
  const caseMap = new Map<
    string,
    {
      externalId: string;
      name: string;
      type: string;
      tags: string[];
      totalExecutions: number;
      passedCount: number;
      failedCount: number;
      flakyCount: number;
      totalDurationMs: number;
      latestStatus: string;
      latestRunId: string;
      latestRunDate: Date;
      history: Array<{
        runId: string;
        date: Date;
        status: string;
        flaky: boolean;
        durationMs: number;
      }>;
    }
  >();

  for (const c of cases) {
    const existing = caseMap.get(c.externalId) || {
      externalId: c.externalId,
      name: c.name,
      type: c.type,
      tags: c.tags,
      totalExecutions: 0,
      passedCount: 0,
      failedCount: 0,
      flakyCount: 0,
      totalDurationMs: 0,
      latestStatus: c.status,
      latestRunId: c.run.id,
      latestRunDate: c.run.createdAt,
      history: [],
    };

    existing.totalExecutions += 1;
    if (c.status === "pass") existing.passedCount += 1;
    if (c.status === "fail") existing.failedCount += 1;
    if (c.flaky) existing.flakyCount += 1;
    existing.totalDurationMs += c.durationMs;

    // Maintain history (sorted newest to oldest)
    if (existing.history.length < 10) {
      existing.history.push({
        runId: c.run.id,
        date: c.run.createdAt,
        status: c.status,
        flaky: c.flaky,
        durationMs: c.durationMs,
      });
    }

    caseMap.set(c.externalId, existing);
  }

  const uniqueCases = Array.from(caseMap.values());

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-500" />
            Test Case Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Catalog of all defined test cases, historical pass rates, and stability index
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-[#111827] border border-[#1e293b] px-3 py-1.5 rounded-lg">
          <strong className="text-slate-200">{uniqueCases.length}</strong> unique test cases registered
        </div>
      </div>

      {/* Case List */}
      <div className="space-y-4">
        {uniqueCases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-[#111827] border border-[#1e293b] rounded-xl">
            No test cases found. Run tests via CLI first to populate the catalog.
          </div>
        ) : (
          uniqueCases.map((tc) => {
            const passRate = Math.round((tc.passedCount / tc.totalExecutions) * 100);
            const avgDuration = Math.round(tc.totalDurationMs / tc.totalExecutions);

            return (
              <div
                key={tc.externalId}
                className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 shadow-sm hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Title and tags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-200">{tc.name}</h3>
                      <code className="text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded">
                        {tc.externalId}
                      </code>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tc.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                      <span>Tags:</span>
                      {tc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-300 bg-[#1e293b] px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Middle Column: Reliability Metrics */}
                  <div className="flex items-center gap-8 text-xs shrink-0">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                        Success Rate
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${passRate >= 80 ? "bg-emerald-400" : "bg-red-400"}`}
                            style={{ width: `${passRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-200">{passRate}%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                        Avg Latency
                      </span>
                      <div className="text-slate-200 font-mono mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDuration(avgDuration)}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                        Flaky Rate
                      </span>
                      <div className="text-slate-200 font-medium mt-1">
                        {tc.flakyCount > 0 ? (
                          <span className="text-amber-400 font-semibold">{tc.flakyCount} / {tc.totalExecutions}</span>
                        ) : (
                          <span className="text-emerald-400">0%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Execution History Dots */}
                  <div className="shrink-0 space-y-1.5">
                    <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                      Recent Runs ({tc.history.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      {tc.history.map((h, idx) => {
                        const isPass = h.status === "pass";
                        return (
                          <Link
                            key={idx}
                            href={`/runs/${h.runId}`}
                            title={`Run ${h.runId.slice(0, 8)} on ${formatDate(h.date)}: ${h.status.toUpperCase()}${h.flaky ? " (FLAKY)" : ""}`}
                            className={`w-4 h-4 rounded flex items-center justify-center transition-transform hover:scale-125 ${
                              h.flaky
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                : isPass
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-red-500/20 text-red-400 border border-red-500/40"
                            }`}
                          >
                            {h.flaky ? (
                              <span className="text-[9px] font-bold">!</span>
                            ) : isPass ? (
                              <span className="text-[9px]">✓</span>
                            ) : (
                              <span className="text-[9px]">✗</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
