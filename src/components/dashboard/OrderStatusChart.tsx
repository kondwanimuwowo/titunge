"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";

interface OrderStatusData {
  status: string;
  count: number;
}

interface OrderStatusChartProps {
  data: OrderStatusData[];
}

const COLORS: Record<string, string> = {
  enquiry: "#9ca3af", // gray-400
  contacted: "#60a5fa", // blue-400
  measurements: "#a78bfa", // purple-400
  production: "#facc15", // yellow-400
  fitting: "#fb923c", // orange-400
  completed: "#34d399", // emerald-400
  delivered: "#10b981", // emerald-500
  cancelled: "#f87171", // red-400
};

const STATUS_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  contacted: "Contacted",
  measurements: "Measurements",
  production: "Production",
  fitting: "Fitting",
  completed: "Completed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderStatusChart({ data }: OrderStatusChartProps) {
  const chartData = data.map((item) => ({
    status: item.status,
    name: STATUS_LABELS[item.status] || item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  })).filter(item => item.value > 0);

  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col shadow-sm">
        <h3 className="font-semibold text-foreground mb-1">Orders by Status</h3>
        <p className="text-sm text-muted-foreground mb-6">Current distributions</p>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
          <p>No active orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col shadow-sm">
      <div className="mb-2">
        <h3 className="font-semibold text-foreground">
          Orders by Status
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({totalOrders} total)
          </span>
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">Distribution of all active orders</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative flex"
        style={{ height: 270 }}
      >
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.status] || "#999"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                formatter={(value: any, name: any) => {
                  if (typeof value !== "number") return ["—", name || "—"];
                  return [`${value} orders`, name];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend placed to the right for a sleeker look */}
        <div className="w-1/2 h-full flex flex-col justify-center gap-3 pl-4">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: COLORS[item.status] }}
              />
              <div className="flex-1 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
