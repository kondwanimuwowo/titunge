"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

interface EmployeeProductivityChartProps {
  data: { name: string; hours: number; orders: number }[];
}

export function EmployeeProductivityChart({ data }: EmployeeProductivityChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-sm text-foreground">
          Employee Productivity (Last 30 Days)
        </h3>
        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
          No productivity data available for this period.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <h3 className="font-semibold text-sm text-foreground">
        Employee Productivity (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
          <Bar
            dataKey="hours"
            name="Hours Worked"
            fill={CHART_COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="orders"
            name="Completed Orders"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
