import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/utils";
import { 
  PlaySquare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await db.testRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cases: {
        select: {
          id: true,
          status: true,
          flaky: true,
          type: true,
        },
      },
    },
  });

  const totalRuns = runs.length;
  const totalPassed = runs.reduce((acc, r) => acc + r.passed, 0);
  const totalFailed = runs.reduce((acc, r) => acc + r.failed, 0);
  const totalCases = runs.reduce((acc, r) => acc + r.total, 0);
  const passRate = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;
  
  const totalFlaky = runs.reduce(
    (acc, r) => acc + r.cases.filter((c) => c.flaky).length,
    0
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <PlaySquare className="w-6 h-6 text-blue-500" />
            Test Execution Runs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical test suite runs executed by the self-built QATOOL engine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Engine Online
          </span>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Runs</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalRuns}</div>
          <p className="text-[11px] text-slate-400 mt-1">Logged in PostgreSQL</p>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overall Pass Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{passRate}%</div>
          <p className="text-[11px] text-emerald-400/90 mt-1">{totalPassed} passed / {totalFailed} failed</p>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Flaky Tests</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalFlaky}</div>
          <p className="text-[11px] text-slate-400 mt-1">Detected across all runs</p>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Cases Run</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalCases}</div>
          <p className="text-[11px] text-slate-400 mt-1">API & CDP Browser steps</p>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Execution History</h2>
          <span className="text-xs text-slate-400">{runs.length} runs recorded</span>
        </div>

        {runs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No test runs recorded yet. Execute <code className="text-blue-400 bg-slate-800 px-1.5 py-0.5 rounded">qatool run --suite=./tests</code> to view runs here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#0d1322]/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Run ID</th>
                  <th className="py-3.5 px-6">Suite Directory</th>
                  <th className="py-3.5 px-6">Results</th>
                  <th className="py-3.5 px-6">Duration</th>
                  <th className="py-3.5 px-6">Executed At</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-xs">
                {runs.map((run) => {
                  const hasFailed = run.failed > 0;
                  const flakyInRun = run.cases.filter((c) => c.flaky).length;

                  return (
                    <tr 
                      key={run.id}
                      className="hover:bg-[#151e32]/60 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        {hasFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PASSED
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <code className="text-xs font-mono text-slate-300 bg-[#0d1322] px-2 py-1 rounded border border-[#1e293b]">
                          {run.id.slice(0, 8)}...
                        </code>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-slate-300 font-medium truncate max-w-xs block" title={run.suiteDir}>
                          {run.suiteDir.split("\\").pop() || run.suiteDir.split("/").pop() || run.suiteDir}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-semibold">{run.passed} passed</span>
                          {run.failed > 0 && (
                            <span className="text-red-400 font-semibold">, {run.failed} failed</span>
                          )}
                          {flakyInRun > 0 && (
                            <span className="text-amber-400 font-semibold">, {flakyInRun} flaky</span>
                          )}
                          <span className="text-slate-400">/ {run.total} total</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDuration(run.durationMs)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-400">
                        {formatDate(run.createdAt)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/runs/${run.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
