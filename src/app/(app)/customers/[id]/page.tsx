import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCustomerWithOrders, getCustomerStats } from "@/lib/data/customers";
import { getBusinessContext } from "@/lib/business-context";
import CustomerDetailsView from "@/components/customers/CustomerDetailsView";
import { Button } from "@/components/ui/button";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { businessId } = await getBusinessContext();

  let customer;
  let stats;

  try {
    customer = await getCustomerWithOrders(businessId, id);
    stats = await getCustomerStats(businessId, id);
  } catch (error) {
    console.error("Customer not found or error:", error);
    notFound();
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          {/* @ts-ignore - shadcn button.jsx type inference failure */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-sm font-medium text-muted-foreground mr-auto flex items-center gap-2">
          <Link href="/customers" className="hover:text-foreground transition-colors">Customers</Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-semibold">{customer.name}</span>
        </div>
      </div>

      <CustomerDetailsView customer={customer} stats={stats} />
    </div>
  );
}
