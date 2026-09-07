import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  Layers,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
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

    if (existing.history.length < 12) {
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-primary" />
            Test Case Management & Explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lightweight TestRail / Xray catalog: organization by tags, stability indices, and execution history
          </p>
        </div>

        <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
          {uniqueCases.length} Test Cases Registered
        </Badge>
      </div>

      {/* Test Case Cards */}
      <div className="space-y-4">
        {uniqueCases.length === 0 ? (
          <Card className="shadow-xs">
            <CardContent className="p-12 text-center text-xs text-muted-foreground">
              No test cases found. Execute test suites to populate the catalog.
            </CardContent>
          </Card>
        ) : (
          uniqueCases.map((tc) => {
            const passRate = Math.round(
              (tc.passedCount / tc.totalExecutions) * 100
            );
            const avgDuration = Math.round(
              tc.totalDurationMs / tc.totalExecutions
            );

            return (
              <Card
                key={tc.externalId}
                className="shadow-xs hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">
                          {tc.name}
                        </h3>
                        <code className="rounded border bg-muted/60 px-2 py-0.5 font-mono text-xs text-primary font-semibold">
                          {tc.externalId}
                        </code>
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                          {tc.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                        <span className="text-[11px] font-medium">Tags:</span>
                        {tc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Middle: Stats */}
                    <div className="flex items-center gap-8 text-xs shrink-0">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Pass Rate
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                passRate >= 80
                                  ? "bg-emerald-500"
                                  : "bg-destructive"
                              }`}
                              style={{ width: `${passRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-foreground">
                            {passRate}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Avg Latency
                        </span>
                        <div className="font-mono text-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDuration(avgDuration)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Flaky Rate
                        </span>
                        <div className="mt-1 font-semibold">
                          {tc.flakyCount > 0 ? (
                            <span className="text-amber-500">
                              {tc.flakyCount} / {tc.totalExecutions}
                            </span>
                          ) : (
                            <span className="text-emerald-500">0%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: History run indicators */}
                    <div className="space-y-1.5 shrink-0">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Recent Executions ({tc.history.length})
                      </span>
                      <div className="flex items-center gap-1.5">
                        {tc.history.map((h, idx) => {
                          const isPass = h.status === "pass";
                          return (
                            <Link
                              key={idx}
                              href={`/runs/${h.runId}`}
                              title={`Run on ${formatDate(h.date)}: ${h.status.toUpperCase()}${
                                h.flaky ? " (FLAKY)" : ""
                              }`}
                              className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold transition-transform hover:scale-125 ${
                                h.flaky
                                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-500"
                                  : isPass
                                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                                  : "border border-destructive/40 bg-destructive/15 text-destructive"
                              }`}
                            >
                              {h.flaky ? "!" : isPass ? "✓" : "✗"}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
