import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/business-context";
import { getOrderById } from "@/lib/data/orders";
import { getMaterials } from "@/lib/data/inventory";
import OrderDetailsView from "@/components/orders/OrderDetailsView";
import { Button } from "@/components/ui/button";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { businessId } = await getBusinessContext();
  let order;
  let availableMaterials;
  try {
    [order, availableMaterials] = await Promise.all([getOrderById(businessId, id), getMaterials(businessId)]);
  } catch (error) {
    console.error("Order not found or error:", error);
    notFound();
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          {/* @ts-ignore - shadcn button.jsx type inference failure */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-sm font-medium text-muted-foreground mr-auto">
          <Link href="/orders" className="hover:text-foreground transition-colors">Orders</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{order.order_number}</span>
        </div>
      </div>

      <OrderDetailsView order={order} availableMaterials={availableMaterials || []} />
    </div>
  );
}
