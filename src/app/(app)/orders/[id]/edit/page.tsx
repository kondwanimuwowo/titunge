import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/business-context";
import { getOrderById } from "@/lib/data/orders";
import { getCustomers } from "@/lib/data/customers";
import { getEmployees } from "@/lib/data/employees";
import { getProducts } from "@/lib/data/products";
import { getMaterials } from "@/lib/data/inventory";
import { getGarmentTypes, getFinancialSettings, getOverheadCosts } from "@/lib/data/finance";
import { Button } from "@/components/ui/button";
import OrderEditForm from "@/components/orders/OrderEditForm";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const metadata = { title: "Edit Order — Gloriaz Daughter" };

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { businessId } = await getBusinessContext();
  const { id } = await params;
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  let order: any;
  try {
    order = await getOrderById(businessId, id);
  } catch {
    notFound();
  }

  const [customers, employees, products, garmentTypes, financialSettings, overheadCosts, materials] =
    await Promise.all([
      getCustomers(businessId),
      getEmployees(businessId),
      getProducts(businessId),
      getGarmentTypes(businessId),
      getFinancialSettings(businessId),
      getOverheadCosts(businessId, monthStart, monthEnd),
      getMaterials(businessId),
    ]);

  const totalOverhead = overheadCosts.reduce(
    (sum: number, r: any) => sum + parseFloat(r.amount || "0"),
    0
  );
  const expectedOrders = (financialSettings as any)?.expected_monthly_orders || 20;
  const perOrderOverhead = parseFloat((totalOverhead / Math.max(1, expectedOrders)).toFixed(2));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/orders/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Edit Order</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{order.order_number}</p>
        </div>
      </div>

      <OrderEditForm
        order={order}
        customers={customers}
        employees={employees}
        products={products}
        garmentTypes={garmentTypes}
        materials={materials}
        financialSettings={financialSettings}
        perOrderOverhead={perOrderOverhead}
      />
    </div>
  );
}
