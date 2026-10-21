"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Trash2, HelpCircle, ChevronsUpDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { path: "/manual", icon: HelpCircle, label: "Help & Manual", roles: ["admin", "manager", "employee"] },
];

// Always reachable, even in marketplace-only mode.
const ALWAYS_VISIBLE = new Set(["/manual"]);

interface SidebarFooterNavProps {
  role: UserRole;
  focus?: "full_erp" | "marketplace_only";
}

export function SidebarFooterNav({ role, focus = "full_erp" }: SidebarFooterNavProps) {
  const pathname = usePathname();

  const items = FOOTER_ITEMS.filter((item) => {
    if (!(item.roles as readonly string[]).includes(role)) return false;
    if (focus === "marketplace_only" && !ALWAYS_VISIBLE.has(item.path) && !MARKETPLACE_ONLY_PATHS.has(item.path)) {
      return false;
    }
    return true;
  });

  const hasActiveItem = items.some((item) => isPathActive(pathname, item.path));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "sidebar-nav-link w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 text-sm font-medium",
            hasActiveItem && "active"
          )}
        >
          <ShieldCheck size={15} className="sidebar-nav-icon transition-colors" />
          <span className="flex-1 text-left capitalize truncate">{role}</span>
          <ChevronsUpDown size={13} className="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Access level: <span className="font-semibold text-foreground capitalize">{role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link
              href={item.path}
              className={cn("cursor-pointer gap-2", isPathActive(pathname, item.path) && "font-semibold")}
            >
              <item.icon size={14} className="shrink-0 text-muted-foreground" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
