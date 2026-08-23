"use client";

import { useState } from "react";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: string;
}

interface Props {
  businesses: Business[];
  currentBusinessId: string;
  currentBusinessName: string;
}

function goToBusiness(slug: string) {
  if (process.env.NODE_ENV === "development") {
    document.cookie = `titunge-business=${slug}; path=/; max-age=${60 * 60 * 24 * 30}`;
    window.location.href = "/dashboard";
  } else {
    window.location.href = `https://${slug}.${APP_DOMAIN}/dashboard`;
  }
}

export default function BusinessSwitcher({ businesses, currentBusinessId, currentBusinessName }: Props) {
  const [open, setOpen] = useState(false);

  // Only one business — no switcher needed, just the plain label.
  if (businesses.length <= 1) {
    return (
      <p
        className="text-sm font-bold truncate leading-tight"
        style={{ color: "hsl(var(--primary) / 0.9)" }}
      >
        {currentBusinessName}
      </p>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-1.5 text-sm font-bold truncate leading-tight group"
          style={{ color: "hsl(var(--primary) / 0.9)" }}
        >
          <span className="truncate">{currentBusinessName}</span>
          <ChevronsUpDown size={13} className="shrink-0 opacity-60 group-hover:opacity-100" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {businesses.map((b) => (
          <DropdownMenuItem
            key={b.id}
            className="cursor-pointer gap-2"
            onClick={() => {
              if (b.id !== currentBusinessId) goToBusiness(b.slug);
            }}
          >
            <Building2 size={14} className="shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{b.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{b.role}</p>
            </div>
            {b.id === currentBusinessId && <Check size={14} className="shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
