"use client";

import { motion } from "framer-motion";
import type { DocumentStatus } from "@/lib/types/database";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; textColor: string; dotColor: string }> = {
  draft: { label: "Draft", textColor: "text-gray-600", dotColor: "bg-gray-500" },
  sent: { label: "Sent", textColor: "text-blue-700", dotColor: "bg-blue-500" },
  accepted: { label: "Accepted", textColor: "text-green-700", dotColor: "bg-green-500" },
  declined: { label: "Declined", textColor: "text-red-700", dotColor: "bg-red-500" },
  expired: { label: "Expired", textColor: "text-gray-500", dotColor: "bg-gray-400" },
  paid: { label: "Paid", textColor: "text-green-700", dotColor: "bg-green-500" },
  partially_paid: { label: "Partially Paid", textColor: "text-yellow-700", dotColor: "bg-yellow-500" },
  overdue: { label: "Overdue", textColor: "text-red-700", dotColor: "bg-red-500" },
  void: { label: "Void", textColor: "text-gray-500", dotColor: "bg-gray-400" },
};

export default function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${config.textColor}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotColor}`}></span>
      {config.label}
    </motion.div>
  );
}
