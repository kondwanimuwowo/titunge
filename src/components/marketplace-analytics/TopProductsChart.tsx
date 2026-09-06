"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { formatZmw } from "@/lib/marketplace-currency";

interface TopProductsChartProps {
  data: { productName: string; revenue: number }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4 h-[300px] flex flex-col">
        <h3 className="font-semibold text-sm text-foreground mb-1">Top products</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No marketplace sales yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <h3 className="font-semibold text-sm text-foreground">Top products</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `K${v}`} />
          <YAxis
            type="category"
            dataKey="productName"
            width={120}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: any) => [formatZmw(Number(value)), "Revenue"]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
