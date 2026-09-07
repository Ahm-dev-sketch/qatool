import { db } from "@/lib/db";
import { TrendCharts } from "@/components/TrendCharts";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Flame,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  // Calculate Flaky Leaderboard (grouped by test case externalId)
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Activity className="h-6 w-6 text-primary" />
          Trends & Stability Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Execution trends, duration timelines, and flaky test leaderboard
        </p>
      </div>

      {/* Recharts Area & Bar Charts */}
      <TrendCharts data={chartData} />

      {/* Flaky Test Leaderboard */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <div>
              <CardTitle className="text-sm font-semibold">
                Flaky Test Leaderboard
              </CardTitle>
              <CardDescription className="text-xs">
                Tests that intermittent pass/fail on auto-retry
              </CardDescription>
            </div>
          </div>
          <Badge variant="warning" className="text-xs">
            {flakyLeaderboard.length} Unstable Tests
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {flakyLeaderboard.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Award className="h-8 w-8 text-emerald-500/60" />
              <span>
                Zero flaky tests detected! All tests consistently pass or fail cleanly on their initial attempt.
              </span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <TableHead className="w-16 pl-6">Rank</TableHead>
                  <TableHead>Test Case</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead>Flaky Count</TableHead>
                  <TableHead>Flaky Rate</TableHead>
                  <TableHead className="pr-6 text-right">Avg Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {flakyLeaderboard.map((item, idx) => {
                  const flakyPct = Math.round(
                    (item.flakyCount / item.runs) * 100
                  );
                  const avgDuration = Math.round(
                    item.totalDuration / item.runs
                  );

                  return (
                    <TableRow key={item.externalId} className="hover:bg-muted/40">
                      <TableCell className="pl-6 font-bold text-amber-500">
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {item.name}
                        </div>
                        <code className="font-mono text-[10px] text-muted-foreground">
                          {item.externalId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning" className="gap-1 font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          {item.flakyCount} times
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${Math.min(100, flakyPct)}%`,
                              }}
                            />
                          </div>
                          <span className="font-medium text-foreground">
                            {flakyPct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right font-mono text-muted-foreground">
                        {formatDuration(avgDuration)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
