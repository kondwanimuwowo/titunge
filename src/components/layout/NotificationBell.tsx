"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, ShoppingCart, Package, CheckCircle2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  initialUnreadCount: number;
  initialNotifications: any[];
}

const iconMap: Record<string, React.ElementType> = {
  low_stock: AlertTriangle,
  order_update: ShoppingCart,
  production_complete: Package,
  system: Bell,
};

const colorMap: Record<string, string> = {
  low_stock: "text-amber-500",
  order_update: "text-blue-500",
  production_complete: "text-green-500",
  system: "text-muted-foreground",
};

export default function NotificationBell({
  initialUnreadCount,
  initialNotifications,
}: NotificationBellProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications:bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  function timeAgo(dateStr: string | null) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 hover:bg-accent rounded-md transition-colors"
        title="Notifications"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-1 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-muted-foreground" />
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <CheckCircle2 size={24} className="mb-2 opacity-40" />
                  <p className="text-xs">You're all caught up</p>
                </div>
              ) : (
                notifications.map((n: any) => {
                  const Icon = iconMap[n.type] || Bell;
                  const iconColor = colorMap[n.type] || "text-muted-foreground";
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0",
                        !n.read && "bg-muted/40"
                      )}
                    >
                      <Icon size={15} className={cn("mt-0.5 shrink-0", iconColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications");
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline py-0.5"
              >
                See all notifications
                <ExternalLink size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
