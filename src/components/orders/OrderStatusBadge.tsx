"use client";

import { motion } from "framer-motion";
import type { OrderStatus } from "@/lib/types/database";

// Fallback if we accidentally pass a string not in the enum
type ExtendedStatus = OrderStatus | "enquiry" | "contacted" | "measurements" | "production" | "fitting" | "completed" | "delivered" | "cancelled";

interface OrderStatusBadgeProps {
  status: ExtendedStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusConfig: Record<
    ExtendedStatus,
    { label: string; color: string; dotColor: string }
  > = {
    enquiry: {
      label: "Enquiry",
      color: "bg-gray-100 text-gray-700 border-gray-300",
      dotColor: "bg-gray-500",
    },
    contacted: {
      label: "Contacted",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      dotColor: "bg-blue-500",
    },
    measurements: {
      label: "Measurements",
      color: "bg-purple-100 text-purple-700 border-purple-300",
      dotColor: "bg-purple-500",
    },
    production: {
      label: "In Production",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      dotColor: "bg-yellow-500",
    },
    fitting: {
      label: "Fitting",
      color: "bg-orange-100 text-orange-700 border-orange-300",
      dotColor: "bg-orange-500",
    },
    completed: {
      label: "Completed",
      color: "bg-green-100 text-green-700 border-green-300",
      dotColor: "bg-green-500",
    },
    delivered: {
      label: "Delivered",
      color: "bg-emerald-100 text-emerald-700 border-emerald-300",
      dotColor: "bg-emerald-500",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-100 text-red-700 border-red-300",
      dotColor: "bg-red-500",
    },
  } as const;

  // Ensure fallback works if an unknown string is passed from db
  const config =
    statusConfig[status as ExtendedStatus] || statusConfig.enquiry;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`}
      ></span>
      {config.label}
    </motion.div>
  );
}
