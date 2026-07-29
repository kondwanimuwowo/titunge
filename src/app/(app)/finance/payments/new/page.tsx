import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import PaymentForm from "@/components/finance/PaymentForm";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const supabase = await createClient();
  const { data: orders } = await (supabase.from("orders") as any)
    .select("id, order_number, total_cost")
    .not("status", "in", '("cancelled")')
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Record Payment</h1>
          <p className="text-sm text-muted-foreground">Log a payment received for an order</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <PaymentForm orders={orders || []} defaultOrderId={order_id} />
      </div>
    </div>
  );
}
