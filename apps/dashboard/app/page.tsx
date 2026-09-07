import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Terminal,
  Zap,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const runs = await db.testRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cases: {
        select: {
          id: true,
          status: true,
          flaky: true,
          type: true,
          durationMs: true,
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

  const avgDuration =
    totalRuns > 0
      ? Math.round(
          runs.reduce((acc, r) => acc + r.durationMs, 0) / totalRuns
        )
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Test Automation Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time test suite telemetry, execution runs, and stability metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/trends">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5 text-primary" />
              View Trends
            </Button>
          </Link>
          <Link href="/explorer">
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" />
              Test Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Test Runs
            </CardTitle>
            <Play className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalRuns}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Recorded in PostgreSQL
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pass Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{passRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">{totalPassed} passed</span> •{" "}
              <span className="text-destructive font-medium">{totalFailed} failed</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Flaky Tests
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totalFlaky}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Recovered on auto-retry
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Suite Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatDuration(avgDuration)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across all execution runs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs">
              All Runs ({runs.length})
            </TabsTrigger>
            <TabsTrigger value="failed" className="text-xs">
              Failed ({runs.filter((r) => r.failed > 0).length})
            </TabsTrigger>
            <TabsTrigger value="passed" className="text-xs">
              Passed ({runs.filter((r) => r.failed === 0).length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="m-0">
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Test Execution History
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Complete log of CLI test suite executions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {runs.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No test runs recorded yet. Execute{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary">
                    qatool run --suite=./tests
                  </code>{" "}
                  to see runs here.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <TableHead className="w-28 pl-6">Status</TableHead>
                      <TableHead className="w-40">Run ID</TableHead>
                      <TableHead>Suite Directory</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Executed At</TableHead>
                      <TableHead className="pr-6 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {runs.map((run) => {
                      const hasFailed = run.failed > 0;
                      const flakyInRun = run.cases.filter((c) => c.flaky).length;

                      return (
                        <TableRow
                          key={run.id}
                          className="hover:bg-muted/40 transition-colors group"
                        >
                          <TableCell className="pl-6">
                            {hasFailed ? (
                              <Badge variant="destructive" className="gap-1 font-semibold">
                                <XCircle className="h-3.5 w-3.5" />
                                FAILED
                              </Badge>
                            ) : (
                              <Badge variant="success" className="gap-1 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                PASSED
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <code className="rounded border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-foreground">
                              {run.id.slice(0, 8)}...
                            </code>
                          </TableCell>

                          <TableCell>
                            <span
                              className="font-medium text-foreground truncate max-w-xs block"
                              title={run.suiteDir}
                            >
                              {run.suiteDir.split("\\").pop() ||
                                run.suiteDir.split("/").pop() ||
                                run.suiteDir}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-emerald-500">
                                {run.passed} passed
                              </span>
                              {run.failed > 0 && (
                                <span className="font-semibold text-destructive">
                                  , {run.failed} failed
                                </span>
                              )}
                              {flakyInRun > 0 && (
                                <span className="font-semibold text-amber-500">
                                  , {flakyInRun} flaky
                                </span>
                              )}
                              <span className="text-muted-foreground">
                                / {run.total} total
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground font-mono">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatDuration(run.durationMs)}</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {formatDate(run.createdAt)}
                          </TableCell>

                          <TableCell className="pr-6 text-right">
                            <Link href={`/runs/${run.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-primary group-hover:bg-primary/10 transition-colors"
                              >
                                <span>Inspect</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed runs tab */}
        <TabsContent value="failed" className="m-0">
          <Card className="shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <TableHead className="w-28 pl-6">Status</TableHead>
                    <TableHead className="w-40">Run ID</TableHead>
                    <TableHead>Suite</TableHead>
                    <TableHead>Failures</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Executed At</TableHead>
                    <TableHead className="pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {runs
                    .filter((r) => r.failed > 0)
                    .map((run) => (
                      <TableRow key={run.id} className="hover:bg-muted/40">
                        <TableCell className="pl-6">
                          <Badge variant="destructive" className="gap-1 font-semibold">
                            <XCircle className="h-3.5 w-3.5" />
                            FAILED
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-foreground">
                            {run.id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {run.suiteDir.split("\\").pop() || run.suiteDir}
                        </TableCell>
                        <TableCell className="text-destructive font-semibold">
                          {run.failed} of {run.total} cases
                        </TableCell>
                        <TableCell>{formatDuration(run.durationMs)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(run.createdAt)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Link href={`/runs/${run.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                              Inspect
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passed runs tab */}
        <TabsContent value="passed" className="m-0">
          <Card className="shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <TableHead className="w-28 pl-6">Status</TableHead>
                    <TableHead className="w-40">Run ID</TableHead>
                    <TableHead>Suite</TableHead>
                    <TableHead>Passed Cases</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Executed At</TableHead>
                    <TableHead className="pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {runs
                    .filter((r) => r.failed === 0)
                    .map((run) => (
                      <TableRow key={run.id} className="hover:bg-muted/40">
                        <TableCell className="pl-6">
                          <Badge variant="success" className="gap-1 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            PASSED
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-foreground">
                            {run.id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {run.suiteDir.split("\\").pop() || run.suiteDir}
                        </TableCell>
                        <TableCell className="text-emerald-500 font-semibold">
                          All {run.total} cases
                        </TableCell>
                        <TableCell>{formatDuration(run.durationMs)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(run.createdAt)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Link href={`/runs/${run.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                              Inspect
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
