"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

interface OrderStatusChartProps {
  data: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  enquiry: "#94a3b8",
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  production: "#8b5cf6",
  completed: "#10b981",
  delivered: CHART_COLORS.primary,
  cancelled: "#ef4444",
};

const FALLBACK_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  CHART_COLORS.primary,
  "#06b6d4",
  "#ec4899",
];

function getColor(status: string, index: number): string {
  return STATUS_COLORS[status.toLowerCase()] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <h3 className="font-semibold text-sm text-foreground">Order Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ status, percent }: any) =>
              `${status} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry.status, index)}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [value, name]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
