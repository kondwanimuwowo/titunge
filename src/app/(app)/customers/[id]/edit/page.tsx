import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById } from "@/lib/data/customers";
import { Button } from "@/components/ui/button";
import CustomerForm from "@/components/customers/CustomerForm";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let customer;
  try {
    customer = await getCustomerById(id);
  } catch {
    notFound();
  }
  if (!customer) notFound();

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${id}`}>
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Customer</h1>
          <p className="text-sm text-muted-foreground">{customer.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <CustomerForm customer={customer} />
      </div>
    </div>
  );
}
