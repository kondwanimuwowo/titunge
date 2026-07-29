"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Trash2,
  Calendar,
  AlertCircle,
  Package,
  ShoppingCart,
  MessageSquare,
  CheckCheck,
} from "lucide-react";
import { markAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";

interface NotificationsListProps {
  initialNotifications: (Tables<"notifications"> & { read: boolean })[];
}

function getIcon(type: string) {
  switch (type) {
    case "low_stock": return <AlertCircle className="text-red-500" size={18} />;
    case "production_complete": return <Package className="text-green-500" size={18} />;
    case "order_update": return <ShoppingCart className="text-blue-500" size={18} />;
    case "new_inquiry": return <MessageSquare className="text-purple-500" size={18} />;
    default: return <Bell className="text-muted-foreground" size={18} />;
  }
}

export default function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        router.refresh();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const result = await markAsRead(id);
      if (result.success) {
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
        router.refresh();
      } else {
        toast.error(result.message || "Failed to mark as read");
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllAsRead();
      if (result.success) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
        router.refresh();
      } else {
        toast.error(result.message || "Failed to mark all as read");
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    startTransition(async () => {
      const result = await deleteNotification(id);
      if (result.success) {
        setNotifications(notifications.filter((n) => n.id !== id));
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete");
      }
    });
  };

  const handleClick = async (notification: any) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            Unread ({unreadCount})
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-card text-muted-foreground hover:text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors ml-1"
            >
              <CheckCheck size={15} />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications card */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="text-muted-foreground" size={20} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No notifications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "unread" ? "You're all caught up — no unread messages." : "No notifications yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={`p-4 flex gap-4 hover:bg-muted/40 transition-colors cursor-pointer group ${
                  !notification.read ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Icon circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notification.read ? "bg-white shadow-sm border border-border/60" : "bg-muted"
                  }`}
                >
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                    {notification.created_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap shrink-0">
                        <Calendar size={11} />
                        {format(new Date(notification.created_at), "MMM d, h:mm a")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                </div>

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    disabled={isPending}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
