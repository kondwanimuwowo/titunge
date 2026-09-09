"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Users, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatZmw } from "@/lib/marketplace-currency";
import { upgradeToTeamPlanAction, saveBillingProfileAction } from "@/app/actions/billing";
import { StatusDot, type StatusTone } from "@/components/layout/StatusDot";

interface BillingTabProps {
  plan: "free" | "team";
  seatCount: number;
  seatPriceKwacha: number;
  billingProfile: { payment_method: string | null; account_details: Record<string, unknown> | null } | null;
  charges: { id: string; period: string; seat_count: number; amount: number; status: string }[];
}

const STATUS_TONES: Record<string, StatusTone> = {
  pending: "amber",
  successful: "emerald",
  failed: "red",
};

export default function BillingTab({ plan, seatCount, seatPriceKwacha, billingProfile, charges }: BillingTabProps) {
  const seatLimit = plan === "free" ? 1 : null;
  const [phone, setPhone] = useState((billingProfile?.account_details?.phone as string) ?? "");
  const [operator, setOperator] = useState<"airtel" | "mtn" | "zamtel">(
    (billingProfile?.account_details?.operator as "airtel" | "mtn" | "zamtel") ?? "airtel"
  );
  const [isSavingProfile, startSavingProfile] = useTransition();
  const [isUpgrading, startUpgrading] = useTransition();

  const handleSaveProfile = () => {
    startSavingProfile(async () => {
      const result = await saveBillingProfileAction({ phone, operator });
      if (result.success) toast.success("Billing payment method saved");
      else toast.error(result.message || "Failed to save billing details");
    });
  };

  const handleUpgrade = () => {
    startUpgrading(async () => {
      const result = await upgradeToTeamPlanAction();
      if (result.success) toast.success("Upgraded to Team plan — add a billing payment method below.");
      else toast.error(result.message || "Failed to upgrade");
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan</CardTitle>
              <CardDescription>Your current Titunge plan and seat usage</CardDescription>
            </div>
            <Badge variant={plan === "team" ? "default" : "secondary"} className="capitalize">
              {plan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="text-primary" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {seatCount} {seatLimit ? `/ ${seatLimit}` : ""} user{seatCount === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-muted-foreground">
                {plan === "free"
                  ? "Free plan is limited to 1 user. Upgrade to Team to add staff."
                  : `Team plan — K${seatPriceKwacha}/additional user/month, billed monthly.`}
              </p>
            </div>
          </div>

          {plan === "free" ? (
            <div className="border border-dashed rounded-md p-4 text-sm text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">Upgrade to Team</p>
                <p>Add staff accounts, role-based permissions, advanced analytics and finance, and full inventory
                  and production management. Your first seat stays free.</p>
              </div>
              <Button type="button" onClick={handleUpgrade} loading={isUpgrading}>
                {isUpgrading ? "Upgrading..." : "Upgrade to Team"}
              </Button>
            </div>
          ) : (
            <div className="border rounded-md p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Billing payment method</p>
              <p className="text-xs text-muted-foreground">
                Used to charge your monthly seat fee. Titunge never sees or stores your PIN.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="space-y-1.5">
                  <Label htmlFor="billing-operator">Network</Label>
                  <select
                    id="billing-operator"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as typeof operator)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="airtel">Airtel Money</option>
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="zamtel">Zamtel Kwacha</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="billing-phone">Mobile money number</Label>
                  <Input id="billing-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0977123456" />
                </div>
              </div>
              <Button type="button" onClick={handleSaveProfile} loading={isSavingProfile} className="gap-2">
                {!isSavingProfile && <Save className="h-4 w-4" />}
                {isSavingProfile ? "Saving..." : "Save billing method"}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Marketplace sales carry a 10% Titunge transaction fee on both plans, deducted before your payout.
          </div>
        </CardContent>
      </Card>

      {plan === "team" && charges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Charge history</CardTitle>
            <CardDescription>Monthly seat charges for this business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {charges.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{c.period}</span>
                  <span className="text-muted-foreground">{c.seat_count} seat{c.seat_count === 1 ? "" : "s"}</span>
                  <span className="font-medium">{formatZmw(c.amount)}</span>
                  <StatusDot label={c.status} tone={STATUS_TONES[c.status]} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
