import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/data/orders";
import { getFinancialSettings } from "@/lib/data/finance";
import { Button } from "@/components/ui/button";
import OrderReceipt from "@/components/orders/OrderReceipt";
import PrintReceiptButton from "@/components/orders/PrintReceiptButton";

export default async function OrderReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let order;
  try {
    order = await getOrderById(id);
  } catch {
    notFound();
  }
  if (!order) notFound();

  const settings = await getFinancialSettings();
  const taxRate = parseFloat(String(settings?.tax_rate || 0));

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href={`/orders/${id}`}>
            {/* @ts-ignore */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="text-sm font-medium text-muted-foreground">
            <Link href={`/orders/${id}`} className="hover:text-foreground transition-colors">
              {order.order_number}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Receipt</span>
          </div>
        </div>
        <PrintReceiptButton />
      </div>

      <OrderReceipt order={order} taxRate={taxRate} />
    </div>
  );
}
