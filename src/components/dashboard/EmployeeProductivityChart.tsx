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

interface AttendanceNode {
  employees: { name: string } | null;
  hours_worked: number;
}

interface EmployeeProductivityChartProps {
  data: AttendanceNode[];
}

export default function EmployeeProductivityChart({ data }: EmployeeProductivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col shadow-sm">
        <h3 className="font-semibold text-foreground mb-1">Employee Productivity</h3>
        <p className="text-sm text-muted-foreground mb-6">Today's active hours</p>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
           <p>No productivity data available for today</p>
        </div>
      </div>
    );
  }

  // Aggregate hours by employee name
  const aggregation: Record<string, number> = {};
  data.forEach((entry) => {
    const name = entry.employees?.name || "Unknown";
    aggregation[name] = (aggregation[name] || 0) + Number(entry.hours_worked || 0);
  });

  const chartData = Object.entries(aggregation)
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8); // top 8

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground">Employee Productivity</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Hours worked by top employees today</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 min-h-0" style={{minHeight: 0}}
      >
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }}
              width={100}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any) => typeof value === "number" ? [`${value.toFixed(1)}h`, "Hours Worked"] : ["—", "Hours Worked"]}
            />
            <Bar
              dataKey="hours"
              fill="hsl(var(--primary))"
              name="Hours Worked"
              radius={[0, 4, 4, 0]}
              barSize={24}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
