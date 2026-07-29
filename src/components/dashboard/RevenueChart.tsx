"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface RevenueData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col">
        <h3 className="font-semibold text-foreground mb-1">Revenue Trend</h3>
        <p className="text-sm text-muted-foreground mb-6">Monthly revenue overview</p>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No revenue data available
        </div>
      </div>
    );
  }

  // Format data specifically for chart
  const processedData = data.map((d, i) => {
    // Convert 0-11 index to short month name if the data provides indices
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      name: months[i] || d.month,
      revenue: d.revenue,
    };
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground">Revenue Trend</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Monthly revenue overview (Current Year)</p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 min-h-0" style={{minHeight: 0}}
      >
        <ResponsiveContainer width="100%" height={270}>
          <AreaChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
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
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
              formatter={(value: any) => typeof value === "number" ? [`K${value.toFixed(2)}`, "Revenue"] : ["—", "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
