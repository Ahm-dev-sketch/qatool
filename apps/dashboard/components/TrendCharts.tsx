"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

interface TrendDataPoint {
  date: string;
  runId: string;
  passRate: number;
  durationSec: number;
  total: number;
  passed: number;
  failed: number;
  flaky: number;
}

export function TrendCharts({ data }: { data: TrendDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        No execution trends recorded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pass Rate Trend */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Pass Rate Over Time (%)</h3>
          <p className="text-xs text-slate-400">Historical success percentage per test suite run</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1322",
                  borderColor: "#1e293b",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
                formatter={(value: any) => [`${value}%`, "Pass Rate"]}
              />
              <Area
                type="monotone"
                dataKey="passRate"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#passRateGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Duration Trend */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Suite Duration (Seconds)</h3>
          <p className="text-xs text-slate-400">Execution time trend per suite run</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="s" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1322",
                  borderColor: "#1e293b",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
                formatter={(value: any) => [`${value}s`, "Duration"]}
              />
              <Bar dataKey="durationSec" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
