import { redirect } from "next/navigation";
import { Plus, User, TrendingUp, Ruler } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCustomers } from "@/lib/data/customers";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import CustomerList from "@/components/customers/CustomerList";
import { Button } from "@/components/ui/button";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const customers = await getCustomers();

  // Compute stats
  const totalCustomers = customers.length;
  const customersWithMeasurements = customers.filter((c: any) => c.measurements).length;
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const newThisMonth = customers.filter((c: any) => {
    if (!c.created_at) return false;
    const created = new Date(c.created_at);
    return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
  }).length;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Customers"
        description="Manage your customer relationships, contact information, and tailoring measurements."
      >
        <Link href="/customers/new">
          {/* @ts-ignore - shadcn button.jsx type inference failure */}
          <Button size="sm" className="shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Customer
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Customers"
          value={totalCustomers}
          icon={<User size={18} />}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title="With Measurements"
          value={customersWithMeasurements}
          icon={<Ruler size={18} />}
          color="green"
          delay={0.2}
        />
        <StatsCard
          title="New This Month"
          value={newThisMonth}
          icon={<TrendingUp size={18} />}
          color="purple"
          delay={0.3}
        />
      </div>

      {/* Interactive Client Component for the DataTable */}
      <CustomerList initialCustomers={customers as any[]} />
    </div>
  );
}
