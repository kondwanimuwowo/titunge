"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const iconColorClasses = {
  blue: "bg-blue-50 text-blue-500",
  green: "bg-emerald-50 text-emerald-500",
  red: "bg-red-50 text-red-500",
  yellow: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-500",
  orange: "bg-orange-50 text-orange-500",
  pink: "bg-pink-50 text-pink-500",
  indigo: "bg-indigo-50 text-indigo-500",
  cyan: "bg-cyan-50 text-cyan-500",
  default: "bg-muted/30 text-muted-foreground/60",
} as const;

type ColorKey = keyof typeof iconColorClasses;

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: ColorKey;
  trend?: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = "default",
  trend,
  delay = 0,
}: StatsCardProps) {
  const iconClasses = iconColorClasses[color] || iconColorClasses.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="h-full w-full"
    >
      <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 h-full relative overflow-hidden p-4">
        <div className="flex flex-col h-full">
          <p className="text-xs text-muted-foreground mb-0.5 font-medium">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
                parseFloat(trend) >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {parseFloat(trend) >= 0 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{Math.abs(parseFloat(trend))}% vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "absolute top-3.5 right-3.5 w-9 h-9 rounded-lg flex items-center justify-center",
            iconClasses
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
