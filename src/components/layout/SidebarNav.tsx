"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCircle,
  Scissors,
  Shield,
  DollarSign,
  BarChart3,
  Shirt,
  Settings,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "manager", "employee"] },
  { path: "/inventory",  icon: Package,         label: "Inventory",  roles: ["admin", "manager"] },
  { path: "/products",   icon: Shirt,           label: "Products",   roles: ["admin", "manager"] },
  { path: "/orders",     icon: ShoppingCart,    label: "Orders",     roles: ["admin", "manager", "employee"] },
  { path: "/inquiries",  icon: MessageSquare,   label: "Inquiries",  roles: ["admin", "manager"] },
  { path: "/production", icon: Scissors,        label: "Production", roles: ["admin", "manager", "employee"] },
  { path: "/employees",  icon: Users,           label: "Employees",  roles: ["admin", "manager"] },
  { path: "/customers",  icon: UserCircle,      label: "Customers",  roles: ["admin", "manager", "employee"] },
  { path: "/finance",    icon: DollarSign,      label: "Finance",    roles: ["admin", "manager"] },
  { path: "/analytics",  icon: BarChart3,       label: "Analytics",  roles: ["admin", "manager"] },
  { path: "/users",      icon: Shield,          label: "Users",      roles: ["admin"] },
  { path: "/settings",   icon: Settings,        label: "Settings",   roles: ["admin", "manager"] },
  { path: "/recycle-bin", icon: Trash2,         label: "Recycle Bin", roles: ["admin", "manager"] },
] as const;

interface SidebarNavProps {
  role: UserRole;
  badges?: Record<string, number>;
}

export function SidebarNav({ role, badges = {} }: SidebarNavProps) {
  const pathname = usePathname();
  const [newInquiriesCount, setNewInquiriesCount] = useState(badges["/inquiries"] ?? 0);

  // Live heartbeat: keep the Inquiries badge accurate without a page refresh.
  useEffect(() => {
    const supabase = createClient();

    async function refreshCount() {
      const { count } = await supabase
        .from("customer_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      setNewInquiriesCount(count ?? 0);
    }

    const channel = supabase
      .channel("sidebar:inquiries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_inquiries" },
        refreshCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(role)
  );

  return (
    <ul className="space-y-0.5">
      {filteredItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        const badgeCount =
          item.path === "/inquiries" ? newInquiriesCount : badges[item.path] || 0;
        return (
          <li key={item.path}>
            <Link
              href={item.path}
              className={cn(
                "sidebar-nav-link flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 text-sm font-medium",
                isActive && "active"
              )}
            >
              <item.icon size={15} className="sidebar-nav-icon transition-colors" />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
