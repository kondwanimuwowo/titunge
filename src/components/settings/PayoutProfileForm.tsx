"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Save, CheckCircle2, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolvePayoutAccountAction, savePayoutProfileAction } from "@/app/actions/payout-profile";
import type { LencoOperator } from "@/lib/lenco";

interface PayoutProfileFormProps {
  profile: {
    payout_method: string | null;
    account_details: Record<string, unknown> | null;
    verified_at: string | null;
  } | null;
  banks: { id: string; name: string; country: string }[];
}

const OPERATORS: { value: LencoOperator; label: string }[] = [
  { value: "airtel", label: "Airtel Money" },
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "zamtel", label: "Zamtel Kwacha" },
];

export default function PayoutProfileForm({ profile, banks }: PayoutProfileFormProps) {
  const [method, setMethod] = useState<"bank-account" | "mobile-money">(
    (profile?.payout_method as "bank-account" | "mobile-money") ?? "mobile-money"
  );
  const [accountNumber, setAccountNumber] = useState((profile?.account_details?.accountNumber as string) ?? "");
  const [bankId, setBankId] = useState((profile?.account_details?.bankId as string) ?? "");
  const [phone, setPhone] = useState((profile?.account_details?.phone as string) ?? "");
  const [operator, setOperator] = useState<LencoOperator>((profile?.account_details?.operator as LencoOperator) ?? "airtel");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isResolving, startResolving] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const handleVerify = () => {
    setResolvedName(null);
    startResolving(async () => {
      const result =
        method === "bank-account"
          ? await resolvePayoutAccountAction({ method, accountNumber, bankId })
          : await resolvePayoutAccountAction({ method, phone, operator });

      if (result.success && result.accountName) {
        setResolvedName(result.accountName);
      } else {
        toast.error(result.message || "Could not verify that account.");
      }
    });
  };

  const handleSave = () => {
    startSaving(async () => {
      const result =
        method === "bank-account"
          ? await savePayoutProfileAction({ method, accountNumber, bankId })
          : await savePayoutProfileAction({ method, phone, operator });

      if (result.success) toast.success("Payout account saved");
      else toast.error(result.message || "Failed to save payout account");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout account</CardTitle>
        <CardDescription>
          Where your marketplace sale proceeds are sent, 24 hours after an order is marked delivered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        {profile?.verified_at && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
            <CheckCircle2 size={14} />
            Payout account on file.
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant={method === "mobile-money" ? "default" : "outline"}
            size="sm"
            onClick={() => setMethod("mobile-money")}
          >
            Mobile money
          </Button>
          <Button
            type="button"
            variant={method === "bank-account" ? "default" : "outline"}
            size="sm"
            onClick={() => setMethod("bank-account")}
          >
            Bank account
          </Button>
        </div>

        {method === "mobile-money" ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="operator">Network</Label>
              <select
                id="operator"
                value={operator}
                onChange={(e) => setOperator(e.target.value as LencoOperator)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {OPERATORS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile money number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0977123456" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bankId">Bank</Label>
              {banks.length > 0 ? (
                <select
                  id="bankId"
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a bank</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <Input id="bankId" value={bankId} onChange={(e) => setBankId(e.target.value)} placeholder="Bank code (e.g. 002)" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accountNumber">Account number</Label>
              <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>
          </div>
        )}

        {resolvedName && (
          <p className="text-sm text-foreground">
            Verified account holder: <span className="font-semibold">{resolvedName}</span>
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleVerify} loading={isResolving}>
            {isResolving ? "Verifying..." : "Verify account"}
          </Button>
          <Button type="button" onClick={handleSave} loading={isSaving} disabled={!resolvedName} className="gap-2">
            {!isSaving && <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save payout account"}
          </Button>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Wallet size={13} className="mt-0.5 shrink-0" />
          <p>
            A transfer fee, typically K8.50&ndash;K35 depending on the payout amount, is deducted by Lenco from each
            payout on top of Titunge&apos;s marketplace commission.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
