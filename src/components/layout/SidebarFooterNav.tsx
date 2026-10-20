"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import { MARKETPLACE_ONLY_PATHS, isPathActive } from "./SidebarNav";

interface FooterItem {
  path: string;
  icon: typeof Settings;
  label: string;
  roles: readonly UserRole[];
}

const FOOTER_ITEMS: FooterItem[] = [
  { path: "/settings", icon: Settings, label: "Settings", roles: ["admin", "manager"] },
  { path: "/recycle-bin", icon: Trash2, label: "Recycle Bin", roles: ["admin", "manager"] },
];

interface SidebarFooterNavProps {
  role: UserRole;
  focus?: "full_erp" | "marketplace_only";
}

export function SidebarFooterNav({ role, focus = "full_erp" }: SidebarFooterNavProps) {
  const pathname = usePathname();

  const items = FOOTER_ITEMS.filter((item) => {
    if (!(item.roles as readonly string[]).includes(role)) return false;
    if (focus === "marketplace_only" && !MARKETPLACE_ONLY_PATHS.has(item.path)) return false;
    return true;
  });

  if (items.length === 0) return null;

  return (
    <ul className="space-y-0.5 mb-2">
      {items.map((item) => (
        <li key={item.path}>
          <Link
            href={item.path}
            data-tour={`nav-${item.path.replace(/^\//, "")}`}
            className={cn(
              "sidebar-nav-link flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150 text-sm font-medium",
              isPathActive(pathname, item.path) && "active"
            )}
          >
            <item.icon size={15} className="sidebar-nav-icon transition-colors" />
            <span className="flex-1">{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
