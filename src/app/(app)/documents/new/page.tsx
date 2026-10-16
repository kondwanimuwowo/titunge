import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBusinessContext } from "@/lib/business-context";
import { getCustomers } from "@/lib/data/customers";
import { getFinancialSettings } from "@/lib/data/finance";
import { Button } from "@/components/ui/button";
import CreateDocumentForm from "@/components/documents/CreateDocumentForm";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { businessId } = await getBusinessContext();
  const { type } = await searchParams;

  const [customers, financialSettings] = await Promise.all([
    getCustomers(businessId),
    getFinancialSettings(businessId),
  ]);

  const defaultType = type === "invoice" ? "invoice" : "quotation";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          {/* @ts-expect-error - shadcn button.jsx type inference failure */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-sm font-medium text-muted-foreground">
          <Link href="/documents" className="hover:text-foreground transition-colors">Documents</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">New</span>
        </div>
      </div>

      <CreateDocumentForm customers={customers} financialSettings={financialSettings} defaultType={defaultType} />
    </div>
  );
}
