import { db } from "@/lib/db";
import { TrendCharts } from "@/components/TrendCharts";
import { formatDate, formatDuration } from "@/lib/utils";
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Layers, 
  Flame, 
  Award,
  CheckCircle2,
  XCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const runs = await db.testRun.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      cases: true,
    },
  });

  const chartData = runs.map((r) => {
    const passRate = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
    const flakyCount = r.cases.filter((c) => c.flaky).length;
    return {
      date: formatDate(r.createdAt),
      runId: r.id.slice(0, 8),
      passRate,
      durationSec: Number((r.durationMs / 1000).toFixed(2)),
      total: r.total,
      passed: r.passed,
      failed: r.failed,
      flaky: flakyCount,
    };
  });

  // Calculate Flaky Leaderboard (grouped by test case name / externalId)
  const allCases = await db.testCase.findMany({
    select: {
      externalId: true,
      name: true,
      type: true,
      status: true,
      flaky: true,
      attempts: true,
      durationMs: true,
    },
  });

  const caseStatsMap = new Map<
    string,
    {
      externalId: string;
      name: string;
      type: string;
      runs: number;
      flakyCount: number;
      failedCount: number;
      totalDuration: number;
    }
  >();

  for (const c of allCases) {
    const existing = caseStatsMap.get(c.externalId) || {
      externalId: c.externalId,
      name: c.name,
      type: c.type,
      runs: 0,
      flakyCount: 0,
      failedCount: 0,
      totalDuration: 0,
    };

    existing.runs += 1;
    if (c.flaky) existing.flakyCount += 1;
    if (c.status === "fail") existing.failedCount += 1;
    existing.totalDuration += c.durationMs;

    caseStatsMap.set(c.externalId, existing);
  }

  const flakyLeaderboard = Array.from(caseStatsMap.values())
    .filter((c) => c.flakyCount > 0)
    .sort((a, b) => b.flakyCount - a.flakyCount);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-blue-500" />
          Trends & Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Pass rates, duration timelines, and flaky test leaderboard
        </p>
      </div>

      {/* Visual Charts */}
      <TrendCharts data={chartData} />

      {/* Flaky Test Leaderboard */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-200">Flaky Test Leaderboard</h2>
          </div>
          <span className="text-xs text-slate-400">
            {flakyLeaderboard.length} unstable test(s) detected
          </span>
        </div>

        {flakyLeaderboard.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Award className="w-8 h-8 text-emerald-500/60" />
            <span>No flaky tests detected! All tests consistently pass or fail cleanly on the first attempt.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#0d1322]/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Rank</th>
                  <th className="py-3 px-6">Test Case</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Flaky Occurrences</th>
                  <th className="py-3 px-6">Flaky Rate</th>
                  <th className="py-3 px-6">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-xs">
                {flakyLeaderboard.map((item, idx) => {
                  const flakyPct = Math.round((item.flakyCount / item.runs) * 100);
                  const avgDuration = Math.round(item.totalDuration / item.runs);

                  return (
                    <tr key={item.externalId} className="hover:bg-[#151e32]/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-amber-400">
                        #{idx + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200">{item.name}</div>
                        <code className="text-[10px] font-mono text-slate-400">{item.externalId}</code>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {item.flakyCount} times
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, flakyPct)}%` }}
                            />
                          </div>
                          <span className="text-slate-300 font-medium">{flakyPct}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {formatDuration(avgDuration)}
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
