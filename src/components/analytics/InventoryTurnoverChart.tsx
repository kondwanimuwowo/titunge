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

interface InventoryTurnoverChartProps {
  data: { material: string; turnover: number }[];
}

export function InventoryTurnoverChart({ data }: InventoryTurnoverChartProps) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <h3 className="font-semibold text-sm text-foreground">Inventory Turnover</h3>
      <p className="text-xs text-muted-foreground">Quantity used ÷ current stock, per material</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="material"
            width={100}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: any) => [`${value}x`, "Turnover"]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="turnover" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
