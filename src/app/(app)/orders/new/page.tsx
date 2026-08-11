import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBusinessContext } from "@/lib/business-context";
import { getCustomers } from "@/lib/data/customers";
import { getEmployees } from "@/lib/data/employees";
import { getProducts } from "@/lib/data/products";
import { getMaterials } from "@/lib/data/inventory";
import { getGarmentTypes, getFinancialSettings, getOverheadCosts } from "@/lib/data/finance";
import { getInquiryById } from "@/lib/data/inquiries";
import { Button } from "@/components/ui/button";
import CreateOrderForm from "@/components/orders/CreateOrderForm";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const metadata = { title: "New Order — Gloriaz Daughter" };

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry_id?: string }>;
}) {
  const { businessId } = await getBusinessContext();
  const params = await searchParams;

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

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

  // Compute per-order overhead contribution
  const totalOverhead = overheadCosts.reduce(
    (sum: number, r: any) => sum + parseFloat(r.amount || "0"),
    0
  );
  const expectedOrders = (financialSettings as any)?.expected_monthly_orders || 20;
  const perOrderOverhead = parseFloat((totalOverhead / Math.max(1, expectedOrders)).toFixed(2));

  // Optional: prefill from an inquiry
  let prefill: any = null;
  if (params.inquiry_id) {
    try {
      prefill = await getInquiryById(businessId, params.inquiry_id);
    } catch {
      // inquiry not found — continue without prefill
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {prefill ? "Convert Inquiry to Order" : "New Order"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {prefill
              ? `Converting inquiry from ${prefill.customer_name}`
              : "Fill in the details below to create a new order"}
          </p>
        </div>
      </div>

      <CreateOrderForm
        customers={customers}
        employees={employees}
        products={products}
        garmentTypes={garmentTypes}
        materials={materials}
        financialSettings={financialSettings}
        perOrderOverhead={perOrderOverhead}
        prefill={prefill}
        inquiryId={params.inquiry_id}
      />
    </div>
  );
}
