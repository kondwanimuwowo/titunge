"use client";

import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StatusDot, type StatusTone } from "@/components/layout/StatusDot";
import {
  updateBusinessPlanAction,
  updateBusinessStatusAction,
  updateBusinessDetailsAction,
} from "@/app/actions/admin-businesses";

interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  status: string;
  created_at: string | null;
  seatCount: number;
}

const STATUS_TONES: Record<string, StatusTone> = {
  active: "emerald",
  suspended: "red",
  trial: "amber",
};

function EditBusinessDialog({ business }: { business: AdminBusiness }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(business.name);
  const [logoUrl, setLogoUrl] = useState(business.logo_url ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBusinessDetailsAction(business.id, { name, logoUrl: logoUrl || null });
      if (result.success) {
        toast.success("Business details saved");
        setOpen(false);
      } else {
        toast.error(result.message || "Failed to save business details");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setName(business.name);
          setLogoUrl(business.logo_url ?? "");
        }
      }}
    >
      <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setOpen(true)}>
        <Pencil className="h-3 w-3" /> Edit
      </Button>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Edit business</DialogTitle>
          <DialogDescription>Update {business.name}&apos;s name and logo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="business-name">Name</Label>
            <Input id="business-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="business-logo">Logo URL</Label>
            <Input
              id="business-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanSelect({ businessId, plan }: { businessId: string; plan: string }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: "free" | "team") => {
    startTransition(async () => {
      const result = await updateBusinessPlanAction(businessId, next);
      if (result.success) {
        toast.success(`Plan changed to ${next}`);
      } else {
        toast.error(result.message || "Failed to change plan");
      }
    });
  };

  return (
    <select
      value={plan}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as "free" | "team")}
      className="text-xs font-medium border border-input rounded-md px-2 py-1 bg-background disabled:opacity-50"
    >
      <option value="free">Free</option>
      <option value="team">Team</option>
    </select>
  );
}

function SuspendToggle({ businessId, status }: { businessId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const isSuspended = status === "suspended";

  const handleToggle = () => {
    const next = isSuspended ? "active" : "suspended";
    const confirmed = window.confirm(
      isSuspended
        ? "Reactivate this business? Their staff will be able to log in again."
        : "Suspend this business? Their staff will be locked out of the dashboard immediately."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await updateBusinessStatusAction(businessId, next);
      if (result.success) {
        toast.success(isSuspended ? "Business reactivated" : "Business suspended");
      } else {
        toast.error(result.message || "Failed to update status");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
    >
      {isPending ? "..." : isSuspended ? "Reactivate" : "Suspend"}
    </button>
  );
}

export function AdminBusinessesTable({ businesses }: { businesses: AdminBusiness[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
    );
  }, [businesses, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or slug..."
          className="pl-8 h-9 text-sm"
        />
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Business</th>
              <th className="text-left px-4 py-2.5">Plan</th>
              <th className="text-right px-4 py-2.5">Seats</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">Created</th>
              <th className="text-right px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.slug}</div>
                </td>
                <td className="px-4 py-2.5">
                  <PlanSelect businessId={b.id} plan={b.plan} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  {b.seatCount} seat{b.seatCount === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <StatusDot label={b.status} tone={STATUS_TONES[b.status]} />
                    <SuspendToggle businessId={b.id} status={b.status} />
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                  {b.created_at ? format(new Date(b.created_at), "dd MMM yyyy") : "-"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <EditBusinessDialog business={b} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {businesses.length === 0 ? "No businesses yet." : "No businesses match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
