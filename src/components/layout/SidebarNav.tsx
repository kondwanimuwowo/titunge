"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  ShieldCheck,
  Wallet,
  CreditCard,
  ListOrdered,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface NavItem {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  roles: readonly UserRole[];
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const DASHBOARD_ITEM: NavItem = {
  path: "/dashboard",
  icon: LayoutDashboard,
  label: "Dashboard",
  roles: ["admin", "manager", "employee"],
};

// Everything that isn't Dashboard lives in one of these groups — 15 flat
// items collapsed into 5 — so a new user sees 6 rows, not 15, and can
// still reach everything two clicks deep instead of one.
const NAV_GROUPS: NavGroup[] = [
  {
    id: "sales",
    label: "Sales",
    items: [
      { path: "/orders", icon: ShoppingCart, label: "Orders", roles: ["admin", "manager", "employee"] },
      { path: "/inquiries", icon: MessageSquare, label: "Inquiries", roles: ["admin", "manager"] },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { path: "/products", icon: Shirt, label: "Products", roles: ["admin", "manager"] },
      { path: "/inventory", icon: Package, label: "Inventory", roles: ["admin", "manager"] },
      { path: "/production", icon: Scissors, label: "Production", roles: ["admin", "manager", "employee"] },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { path: "/customers", icon: UserCircle, label: "Customers", roles: ["admin", "manager", "employee"] },
      { path: "/employees", icon: Users, label: "Employees", roles: ["admin", "manager"] },
      { path: "/users", icon: Shield, label: "Users", roles: ["admin"] },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { path: "/analytics", icon: BarChart3, label: "Analytics", roles: ["admin", "manager"] },
      { path: "/finance", icon: DollarSign, label: "Finance", roles: ["admin", "manager"] },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { path: "/settings", icon: Settings, label: "Settings", roles: ["admin", "manager"] },
      { path: "/recycle-bin", icon: Trash2, label: "Recycle Bin", roles: ["admin", "manager"] },
    ],
  },
];

const PLATFORM_ADMIN_ITEMS = [
  { path: "/admin/businesses", icon: Building2,  label: "Businesses" },
  { path: "/admin/settings", icon: ShieldCheck, label: "Platform Settings" },
  { path: "/admin/orders",   icon: ListOrdered,  label: "Orders" },
  { path: "/admin/payouts",  icon: Wallet,       label: "Payouts" },
  { path: "/admin/billing",  icon: CreditCard,   label: "Seat Billing" },
] as const;

// A business set up for "just sell on the marketplace" gets a decluttered
// default menu — soft preference only, nothing is actually blocked if they
// navigate to a full-ERP page directly, and it's editable in Settings.
// Orders and Analytics now default to their Workshop/Business tab even for
// marketplace-only businesses — a small bit of friction (one extra tab
// click to reach the Marketplace tab) traded for not needing two nav-item
// shapes depending on focus.
const MARKETPLACE_ONLY_PATHS = new Set(["/dashboard", "/products", "/orders", "/analytics", "/settings"]);

interface SidebarNavProps {
  role: UserRole;
  badges?: Record<string, number>;
  isPlatformAdmin?: boolean;
  focus?: "full_erp" | "marketplace_only";
}

function NavLink({ item, badgeCount, isActive }: { item: NavItem; badgeCount: number; isActive: boolean }) {
  return (
    <Link
      href={item.path}
      data-tour={`nav-${item.path.replace(/^\//, "")}`}
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
  );
}

export function SidebarNav({ role, badges = {}, isPlatformAdmin = false, focus = "full_erp" }: SidebarNavProps) {
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

  const visible = (items: NavItem[]) =>
    items.filter((item) => {
      if (!(item.roles as readonly string[]).includes(role)) return false;
      if (focus === "marketplace_only" && !MARKETPLACE_ONLY_PATHS.has(item.path)) return false;
      return true;
    });

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({ ...group, items: visible(group.items) })).filter(
        (group) => group.items.length > 0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, focus]
  );

  // The group containing the current page starts open; the rest start
  // closed. Adjusted during render (not in an effect) whenever the
  // pathname changes, per React's guidance for syncing state to a prop
  // change — avoids an extra post-commit render just to open a group.
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    visibleGroups.filter((g) => g.items.some((i) => isPathActive(pathname, i.path))).map((g) => g.id)
  );
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    const activeGroup = visibleGroups.find((g) => g.items.some((i) => isPathActive(pathname, i.path)));
    if (activeGroup && !openGroups.includes(activeGroup.id)) {
      setOpenGroups([...openGroups, activeGroup.id]);
    }
  }

  const dashboardVisible = (DASHBOARD_ITEM.roles as readonly string[]).includes(role);

  return (
    <ul className="space-y-0.5">
      {dashboardVisible && (
        <li>
          <NavLink
            item={DASHBOARD_ITEM}
            badgeCount={0}
            isActive={isPathActive(pathname, DASHBOARD_ITEM.path)}
          />
        </li>
      )}

      <li>
        <Accordion type="multiple" value={openGroups} onValueChange={setOpenGroups} className="space-y-0.5">
          {visibleGroups.map((group) => {
            const isOpen = openGroups.includes(group.id);
            const groupHasActive = group.items.some((i) => isPathActive(pathname, i.path));
            return (
              <AccordionItem key={group.id} value={group.id} className="border-none">
                <AccordionTrigger
                  data-tour={`nav-group-${group.id}`}
                  className={cn(
                    "sidebar-nav-link py-2 px-3 rounded-md hover:no-underline hover:[&>svg]:opacity-100",
                    groupHasActive && !isOpen && "active"
                  )}
                >
                  <span className="flex-1 text-left">{group.label}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pt-0.5 ml-2 pl-2 border-l border-white/10">
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          item={item}
                          badgeCount={item.path === "/inquiries" ? newInquiriesCount : badges[item.path] || 0}
                          isActive={isPathActive(pathname, item.path)}
                        />
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </li>

      {isPlatformAdmin && (
        <>
          <li className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Titunge Admin
          </li>
          {PLATFORM_ADMIN_ITEMS.map((item) => {
            const isActive = isPathActive(pathname, item.path);
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
                </Link>
              </li>
            );
          })}
        </>
      )}
    </ul>
  );
}

function isPathActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}
