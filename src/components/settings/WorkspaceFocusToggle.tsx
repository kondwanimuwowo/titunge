"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Briefcase, Store } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateBusinessFocus } from "@/app/actions/settings";

export default function WorkspaceFocusToggle({ focus }: { focus: "full_erp" | "marketplace_only" }) {
  const [current, setCurrent] = useState(focus);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (next: "full_erp" | "marketplace_only") => {
    if (next === current) return;
    startTransition(async () => {
      const result = await updateBusinessFocus(next);
      if (result.success) {
        setCurrent(next);
        toast.success("Dashboard menu updated");
      } else {
        toast.error(result.message || "Failed to update");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard focus</CardTitle>
        <CardDescription>Controls which sidebar sections show by default — nothing is ever blocked.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSelect("full_erp")}
          disabled={isPending}
          className={cn(
            "text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-colors disabled:opacity-60",
            current === "full_erp" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
          )}
        >
          <Briefcase size={18} className="text-primary shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-semibold text-foreground">Run my business</p>
            <p className="text-xs text-muted-foreground mt-0.5">Full workshop ERP — orders, production, inventory, finance.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("marketplace_only")}
          disabled={isPending}
          className={cn(
            "text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-colors disabled:opacity-60",
            current === "marketplace_only" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
          )}
        >
          <Store size={18} className="text-primary shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-semibold text-foreground">Just the marketplace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Simpler menu — Products, Marketplace Orders, and Settings.</p>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
