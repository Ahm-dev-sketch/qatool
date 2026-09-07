import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Code,
  Globe,
  Image as ImageIcon,
  Check,
  X,
  ChevronDown,
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
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const run = await db.testRun.findUnique({
    where: { id },
    include: {
      cases: {
        include: {
          steps: {
            include: {
              assertions: true,
            },
          },
        },
      },
    },
  });

  if (!run) {
    notFound();
  }

  const flakyCount = run.cases.filter((c) => c.flaky).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs mb-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Runs
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Run Inspection
            </h1>
            <code className="rounded border bg-muted/60 px-2.5 py-1 font-mono text-xs text-primary font-semibold">
              {run.id}
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Executed on {formatDate(run.createdAt)} • Suite:{" "}
            <span className="font-mono text-foreground">{run.suiteDir}</span>
          </p>
        </div>

        <div>
          {run.failed > 0 ? (
            <Badge variant="destructive" className="px-3 py-1.5 gap-1.5 text-xs font-semibold">
              <XCircle className="h-4 w-4" />
              FAILED ({run.failed} of {run.total} failed)
            </Badge>
          ) : (
            <Badge variant="success" className="px-3 py-1.5 gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              PASSED (All {run.total} cases passed)
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xl font-bold text-foreground">
              {formatDuration(run.durationMs)}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Passed Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xl font-bold text-emerald-500">
              {run.passed} / {run.total}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Failed Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-center gap-2">
            <XCircle className={`h-4 w-4 ${run.failed > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <span className={`text-xl font-bold ${run.failed > 0 ? "text-destructive" : "text-foreground"}`}>
              {run.failed}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Flaky Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${flakyCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className={`text-xl font-bold ${flakyCount > 0 ? "text-amber-500" : "text-foreground"}`}>
              {flakyCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Test Cases List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Test Cases ({run.cases.length})
          </h2>
        </div>

        <div className="space-y-4">
          {run.cases.map((tc) => {
            const isPass = tc.status === "pass";

            return (
              <Card key={tc.id} className="shadow-xs overflow-hidden border-border/80">
                {/* Case Header */}
                <div className="p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isPass ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <h3 className="font-semibold text-foreground text-sm">
                        {tc.name}
                      </h3>

                      <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                        {tc.type}
                      </Badge>

                      {tc.flaky && (
                        <Badge variant="warning" className="gap-1 font-bold text-[10px]">
                          <AlertTriangle className="h-3 w-3" />
                          FLAKY ({tc.attempts} attempts)
                        </Badge>
                      )}

                      {tc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="font-mono text-[11px] text-muted-foreground">
                      ID: {tc.externalId}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-muted-foreground font-mono">
                      {formatDuration(tc.durationMs)}
                    </span>
                    {isPass ? (
                      <Badge variant="success">PASSED</Badge>
                    ) : (
                      <Badge variant="destructive">FAILED</Badge>
                    )}
                  </div>
                </div>

                {/* Steps List */}
                <div className="divide-y divide-border/60">
                  {tc.steps.map((step, idx) => {
                    const stepPass = step.status === "pass";
                    const screenshotUrl = `/api/screenshots/${run.id}/${step.externalId}.png`;

                    return (
                      <div key={step.id} className="p-5 hover:bg-muted/15 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-muted font-mono text-[10px] font-semibold text-muted-foreground mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    stepPass ? "bg-emerald-500" : "bg-destructive"
                                  }`}
                                />
                                <h4 className="text-xs font-semibold text-foreground">
                                  {step.name}
                                </h4>
                                <code className="font-mono text-[10px] text-muted-foreground">
                                  ({step.externalId})
                                </code>
                              </div>

                              {/* Error Banner */}
                              {step.error && (
                                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
                                  <strong className="font-sans">Error: </strong>
                                  {step.error}
                                </div>
                              )}

                              {/* UI Screenshot for failed UI steps */}
                              {tc.type === "ui" && !stepPass && (
                                <div className="mt-3 rounded-lg border border-destructive/30 bg-muted/40 p-3 max-w-xl">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
                                    <ImageIcon className="h-4 w-4 text-destructive" />
                                    Failure Screenshot (CDP Capture)
                                  </div>
                                  <div className="overflow-hidden rounded-md border border-border bg-black/50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={screenshotUrl}
                                      alt={`Failure screenshot for ${step.name}`}
                                      className="h-auto max-h-80 w-full object-contain"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Assertions Table */}
                              {step.assertions.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Assertions ({step.assertions.length})
                                  </span>
                                  <div className="space-y-1">
                                    {step.assertions.map((a) => (
                                      <div
                                        key={a.id}
                                        className={`flex items-start gap-2 rounded-md border p-2 text-xs font-mono ${
                                          a.pass
                                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                                            : "border-destructive/30 bg-destructive/10 text-destructive"
                                        }`}
                                      >
                                        {a.pass ? (
                                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        ) : (
                                          <X className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                          <div>{a.message}</div>
                                          {a.expected && (
                                            <div className="mt-0.5 text-[10px] opacity-75">
                                              expected: {a.expected} | actual:{" "}
                                              {a.actual}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 font-mono text-[11px] text-muted-foreground">
                            {formatDuration(step.durationMs)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
