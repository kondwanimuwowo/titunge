import Image from "next/image";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import type { BusinessRole } from "@/lib/business-context";

interface SidebarProps {
  role: BusinessRole;
  businessName: string;
  logoUrl?: string | null;
  newInquiriesCount?: number;
}

export default function Sidebar({
  role,
  businessName,
  logoUrl,
  newInquiriesCount = 0,
}: SidebarProps) {
  return (
    <aside
      className="w-56 h-full flex flex-col shrink-0 border-r"
      style={{
        background: "hsl(200 18% 10%)",
        borderColor: "hsl(200 12% 16%)",
      }}
    >
      {/* Business identity */}
      <div
        className="flex-shrink-0 px-4 py-4 border-b"
        style={{ borderColor: "hsl(200 12% 16%)" }}
      >
        <Image
          src="/titunge-logo.png"
          alt="Titunge"
          width={140}
          height={42}
          className="object-contain brightness-0 invert mb-2"
        />
        <p
          className="text-xs font-bold truncate leading-tight"
          style={{ color: "hsl(var(--primary) / 0.9)" }}
        >
          {businessName}
        </p>
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "hsl(200 8% 45%)" }}
        >
          Titunge ERP
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 sidebar-scrollbar">
        <SidebarNav role={role} badges={{ "/inquiries": newInquiriesCount }} />
      </nav>

      {/* Footer */}
      <div
        className="flex-shrink-0 p-2 border-t"
        style={{ borderColor: "hsl(200 12% 16%)" }}
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
            background: "hsl(200 18% 8%)",
            borderColor: "hsl(200 12% 16%)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: "hsl(200 8% 40%)" }}
          >
            Access Level
          </p>
          <p
            className="text-xs font-semibold capitalize"
            style={{ color: "hsl(var(--primary) / 0.8)" }}
          >
            {role}
          </p>
        </div>
      </div>
    </aside>
  );
}
