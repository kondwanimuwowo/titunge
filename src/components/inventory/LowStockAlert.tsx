"use client";

import { motion } from "framer-motion";
import type { Tables } from "@/lib/types/database";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LowStockAlertProps {
  materials: Tables<"materials">[];
}

export default function LowStockAlert({ materials }: LowStockAlertProps) {
  const visibleItems = materials.slice(0, 5);
  const hiddenCount = Math.max(0, materials.length - 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <Card className="border-amber-200 bg-amber-50 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">
            {materials.length} material{materials.length !== 1 ? "s" : ""} below minimum stock
          </h3>
          <motion.ul
            className="space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {visibleItems.map((item) => {
              const stock = parseFloat(String(item.stock_quantity || 0));
              const minLevel = parseFloat(String(item.min_stock_level || 0));
              const percentage = minLevel > 0 ? ((stock / minLevel) * 100).toFixed(0) : "0";

              return (
                <motion.li
                  key={item.id}
                  variants={itemVariants}
                  className="flex items-center justify-between text-sm text-amber-800"
                >
                  <span>
                    <strong>{item.name}</strong> — {stock.toFixed(2)} {item.unit} ({percentage}% of minimum)
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
          {hiddenCount > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              +{hiddenCount} more item{hiddenCount !== 1 ? "s" : ""} below minimum
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
