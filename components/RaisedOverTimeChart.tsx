"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = {
  key: string;
  shortLabel: string;
  amount: number;
};

export default function RaisedOverTimeChart({
  data,
}: {
  data: ChartPoint[];
}) {
  return (
    <div
      className="mt-6 h-64 w-full text-base-content"
      style={{ fontFamily: "inherit" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: 12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="raised-over-time-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B4ACC" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#8B4ACC" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(15, 23, 42, 0.08)" />

          <XAxis
            dataKey="shortLabel"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            interval={0}
            padding={{ left: 20, right: 20 }}
            tick={{ fontSize: 14, fill: "rgba(15, 23, 42, 0.7)" }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            width={48}
            orientation="right"
            tickMargin={12}
            tick={{ fontSize: 14, fill: "rgba(15, 23, 42, 0.7)" }}
            tickFormatter={(value: number) => `$${value.toFixed(2)}`}
          />

          <Tooltip
            cursor={{ stroke: "rgba(139, 74, 204, 0.12)", strokeWidth: 2 }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Raised"]}
            labelFormatter={(label) => `${label}`}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
          />

          <Area
            type="monotone"
            dataKey="amount"
            stroke="#8B4ACC"
            strokeWidth={4}
            fill="url(#raised-over-time-fill)"
            dot={{ r: 4, fill: "#8B4ACC", stroke: "#8B4ACC" }}
            activeDot={{ r: 6, fill: "#8B4ACC", stroke: "#8B4ACC" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
