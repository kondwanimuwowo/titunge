"use client";

import { motion } from "framer-motion";
import type { OrderStatus } from "@/lib/types/database";

// Covers both new schema values and legacy GD values for data-migration safety
type ExtendedStatus = OrderStatus | "enquiry" | "contacted" | "measurements" | "fitting";

interface OrderStatusBadgeProps {
  status: ExtendedStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusConfig: Record<
    ExtendedStatus,
    { label: string; textColor: string; dotColor: string }
  > = {
    // New schema statuses
    pending: { label: "Pending", textColor: "text-gray-600", dotColor: "bg-gray-500" },
    in_progress: { label: "In Progress", textColor: "text-blue-700", dotColor: "bg-blue-500" },
    ready: { label: "Ready", textColor: "text-teal-700", dotColor: "bg-teal-500" },
    // Legacy GD statuses (kept for data migration)
    enquiry: { label: "Enquiry", textColor: "text-gray-600", dotColor: "bg-gray-500" },
    contacted: { label: "Contacted", textColor: "text-blue-700", dotColor: "bg-blue-500" },
    measurements: { label: "Measurements", textColor: "text-purple-700", dotColor: "bg-purple-500" },
    production: { label: "In Production", textColor: "text-yellow-700", dotColor: "bg-yellow-500" },
    fitting: { label: "Fitting", textColor: "text-orange-700", dotColor: "bg-orange-500" },
    completed: { label: "Completed", textColor: "text-green-700", dotColor: "bg-green-500" },
    delivered: { label: "Delivered", textColor: "text-emerald-700", dotColor: "bg-emerald-500" },
    cancelled: { label: "Cancelled", textColor: "text-red-700", dotColor: "bg-red-500" },
  } as const;

  // Ensure fallback works if an unknown string is passed from db
  const config =
    statusConfig[status as ExtendedStatus] || statusConfig.enquiry;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${config.textColor}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotColor} animate-pulse`}
      ></span>
      {config.label}
    </motion.div>
  );
}
