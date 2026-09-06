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
  X
} from "lucide-react";

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
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Back Button & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Runs
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <span>Run Details</span>
            <code className="text-xs font-mono bg-[#111827] border border-[#1e293b] text-blue-400 px-2.5 py-1 rounded-lg">
              {run.id}
            </code>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Executed on {formatDate(run.createdAt)} • Suite: <span className="text-slate-300 font-mono">{run.suiteDir}</span>
          </p>
        </div>

        <div>
          {run.failed > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm">
              <XCircle className="w-4 h-4" />
              FAILED ({run.failed} failed)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              PASSED (All {run.total} passed)
            </span>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Duration</span>
          <div className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatDuration(run.durationMs)}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Passed Cases</span>
          <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {run.passed} / {run.total}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Failed Cases</span>
          <div className={`text-xl font-bold mt-1 flex items-center gap-1.5 ${run.failed > 0 ? "text-red-400" : "text-slate-400"}`}>
            <XCircle className="w-4 h-4" />
            {run.failed}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Flaky Tests</span>
          <div className={`text-xl font-bold mt-1 flex items-center gap-1.5 ${flakyCount > 0 ? "text-amber-400" : "text-slate-400"}`}>
            <AlertTriangle className="w-4 h-4" />
            {flakyCount}
          </div>
        </div>
      </div>

      {/* Test Cases Breakdown */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Test Cases ({run.cases.length})
        </h2>

        <div className="space-y-4">
          {run.cases.map((tc) => {
            const isPass = tc.status === "pass";
            return (
              <div
                key={tc.id}
                className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm"
              >
                {/* Case Header */}
                <div className="p-5 border-b border-[#1e293b] bg-[#0d1322]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isPass ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <h3 className="font-semibold text-slate-200 text-sm">{tc.name}</h3>
                      
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tc.type}
                      </span>

                      {tc.flaky && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          FLAKY ({tc.attempts} attempts)
                        </span>
                      )}

                      {tc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-400 bg-[#1e293b] px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      ID: {tc.externalId}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-slate-400">
                      Duration: <strong className="text-slate-200">{formatDuration(tc.durationMs)}</strong>
                    </span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isPass ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                      {tc.status}
                    </span>
                  </div>
                </div>

                {/* Steps List */}
                <div className="divide-y divide-[#1e293b]/70">
                  {tc.steps.map((step, idx) => {
                    const stepPass = step.status === "pass";
                    const screenshotUrl = `/api/screenshots/${run.id}/${step.externalId}.png`;

                    return (
                      <div key={step.id} className="p-4 sm:p-5 hover:bg-[#151e32]/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-400 shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${stepPass ? "bg-emerald-400" : "bg-red-400"}`} />
                                <h4 className="text-xs font-semibold text-slate-200">{step.name}</h4>
                                <code className="text-[10px] font-mono text-slate-400">({step.externalId})</code>
                              </div>

                              {/* Error Banner */}
                              {step.error && (
                                <div className="mt-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono">
                                  <strong className="text-red-400 font-sans">Error: </strong>
                                  {step.error}
                                </div>
                              )}

                              {/* UI Screenshot for failed UI steps */}
                              {tc.type === "ui" && !stepPass && (
                                <div className="mt-3 p-3 bg-[#0d1322] border border-red-500/30 rounded-lg">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                                    <ImageIcon className="w-4 h-4 text-red-400" />
                                    Failure Screenshot (CDP Capture)
                                  </div>
                                  <div className="relative border border-slate-800 rounded-lg overflow-hidden max-w-lg bg-black/40">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={screenshotUrl}
                                      alt={`Failure screenshot for ${step.name}`}
                                      className="w-full h-auto max-h-72 object-contain"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Assertions Table */}
                              {step.assertions.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                                    Assertions ({step.assertions.length})
                                  </div>
                                  <div className="space-y-1">
                                    {step.assertions.map((a) => (
                                      <div
                                        key={a.id}
                                        className={`flex items-start gap-2 p-2 rounded text-xs font-mono border ${a.pass ? "bg-emerald-950/20 border-emerald-800/30 text-emerald-300" : "bg-red-950/20 border-red-800/30 text-red-300"}`}
                                      >
                                        {a.pass ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        ) : (
                                          <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                          <div>{a.message}</div>
                                          {a.expected && (
                                            <div className="text-[10px] opacity-75 mt-0.5">
                                              expected: {a.expected} | actual: {a.actual}
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

                          <div className="text-[11px] text-slate-400 font-mono shrink-0">
                            {formatDuration(step.durationMs)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
