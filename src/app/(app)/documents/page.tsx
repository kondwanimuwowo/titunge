import { getDocuments, getDocumentStats } from "@/lib/data/documents";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import DocumentsHub from "@/components/documents/DocumentsHub";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { businessId } = await getBusinessContext();
  const { tab } = await searchParams;

  const [quotations, invoices, stats] = await Promise.all([
    getDocuments(businessId, "quotation"),
    getDocuments(businessId, "invoice"),
    getDocumentStats(businessId),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Documents"
        description="Quotations and invoices you can send to anyone, whether they're a registered customer or not."
      />

      <DocumentsHub
        quotations={quotations}
        invoices={invoices}
        stats={stats}
        initialTab={tab === "invoices" ? "invoices" : "quotations"}
      />
    </div>
  );
}
