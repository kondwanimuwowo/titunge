import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBusinessContext } from "@/lib/business-context";
import { getDocumentById } from "@/lib/data/documents";
import DocumentDetailView from "@/components/documents/DocumentDetailView";
import { Button } from "@/components/ui/button";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();
  let document;
  try {
    document = await getDocumentById(businessId, id);
  } catch (error) {
    console.error("Document not found or error:", error);
    notFound();
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-sm font-medium text-muted-foreground mr-auto">
          <Link href="/documents" className="hover:text-foreground transition-colors">Documents</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{document.document_number}</span>
        </div>
      </div>

      <DocumentDetailView document={document} />
    </div>
  );
}
