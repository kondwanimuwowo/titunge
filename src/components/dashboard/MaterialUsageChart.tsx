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
import { motion } from "framer-motion";

interface MaterialNode {
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  cost_per_unit: number;
}

interface MaterialUsageChartProps {
  data: MaterialNode[];
}

export default function MaterialUsageChart({ data }: MaterialUsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col shadow-sm">
        <h3 className="font-semibold text-foreground mb-1">Top Materials Used</h3>
        <p className="text-sm text-muted-foreground mb-6">Inventory Value distribution</p>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
           <p>No material data available</p>
        </div>
      </div>
    );
  }

  // We map the raw materials to show top inventory values 
  const chartData = data
    .map(m => ({
      name: m.name,
      quantity: m.stock_quantity,
      cost: m.stock_quantity * m.cost_per_unit,
    }))
    .sort((a,b) => b.cost - a.cost)
    .slice(0, 8); // Top 8 by value

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground">Top Materials Inventory</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Highest value stock components</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 min-h-0" style={{minHeight: 0}}
      >
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              angle={-45}
              textAnchor="end"
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `K${value}`}
              dx={-10}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any, name: any) => {
                if (typeof value !== "number") return ["—", name || "—"];
                if (name === "Total Value") return [`K${value.toFixed(2)}`, name];
                return [value.toFixed(1), name];
              }}
            />
            <Bar
              dataKey="cost"
              fill="hsl(var(--primary))"
              name="Total Value"
              radius={[4, 4, 0, 0]}
              barSize={32}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
