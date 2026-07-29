import Link from "next/link";
import { Scissors, HelpCircle } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import type { UserRole } from "@/lib/types/database";

interface SidebarProps {
  role: UserRole;
  newInquiriesCount?: number;
}

export default function Sidebar({ role, newInquiriesCount = 0 }: SidebarProps) {
  return (
    <aside
      className="w-56 h-full flex flex-col shrink-0 border-r"
      style={{
        background: "hsl(28 22% 11%)",
        borderColor: "hsl(28 22% 17%)",
      }}
    >
      {/* Logo */}
      <div
        className="flex-shrink-0 px-4 py-3.5 border-b"
        style={{ borderColor: "hsl(28 22% 17%)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.2)" }}
          >
            <Scissors style={{ color: "hsl(46 70% 55%)" }} size={16} />
          </div>
          <div>
            <h1
              className="font-bold text-sm tracking-tight leading-none"
              style={{ color: "hsl(46 60% 72%)" }}
            >
              GLORIAZ
            </h1>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "hsl(46 40% 52%)" }}
            >
              Daughter
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 sidebar-scrollbar">
        <SidebarNav role={role} badges={{ "/inquiries": newInquiriesCount }} />
      </nav>

      {/* Footer */}
      <div
        className="flex-shrink-0 p-2 border-t"
        style={{ borderColor: "hsl(28 22% 17%)" }}
      >
        <Link
          href="/manual"
          className="sidebar-help-link flex items-center gap-1.5 px-2.5 py-1.5 rounded-md mb-2 transition-all text-[10px] font-semibold border"
        >
          <HelpCircle size={12} />
          <span>HELP &amp; MANUAL</span>
        </Link>

        <div
          className="rounded-md p-2 border"
          style={{
            background: "hsl(28 22% 8%)",
            borderColor: "hsl(28 22% 17%)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: "hsl(28 10% 45%)" }}
          >
            Access Level
          </p>
          <p
            className="text-xs font-semibold capitalize"
            style={{ color: "hsl(46 50% 68%)" }}
          >
            {role}
          </p>
        </div>
      </div>
    </aside>
  );
}
