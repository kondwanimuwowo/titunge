"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/business-context";
import { createAdminClient } from "@/lib/supabase/server";
import {
  resolveBankAccount,
  resolveMobileMoneyAccount,
  createBankTransferRecipient,
  createMobileMoneyTransferRecipient,
  type LencoOperator,
} from "@/lib/lenco";

export async function resolvePayoutAccountAction(
  data:
    | { method: "bank-account"; accountNumber: string; bankId: string }
    | { method: "mobile-money"; phone: string; operator: LencoOperator }
): Promise<{ success: boolean; accountName?: string; message?: string }> {
  await requireBusinessContext();

  try {
    const resolved =
      data.method === "bank-account"
        ? await resolveBankAccount(data.accountNumber, data.bankId)
        : await resolveMobileMoneyAccount(data.phone, data.operator);
    return { success: true, accountName: resolved.accountName };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Could not verify account." };
  }
}

export async function savePayoutProfileAction(
  data:
    | { method: "bank-account"; accountNumber: string; bankId: string }
    | { method: "mobile-money"; phone: string; operator: LencoOperator }
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();

  let recipient;
  try {
    recipient =
      data.method === "bank-account"
        ? await createBankTransferRecipient(data.accountNumber, data.bankId)
        : await createMobileMoneyTransferRecipient(data.phone, data.operator);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Could not verify account details." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("business_payout_profiles").upsert(
    {
      business_id: businessId,
      payout_method: data.method,
      account_details: data,
      lenco_recipient_id: recipient.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" }
  );

  if (error) {
    console.error("Save payout profile error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
