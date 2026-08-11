import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerForm from "@/components/customers/CustomerForm";

export default async function NewCustomerPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Customer</h1>
          <p className="text-sm text-muted-foreground">Create a new customer profile</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <CustomerForm />
      </div>
    </div>
  );
}
