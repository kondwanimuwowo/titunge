import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Phone, Mail, ArrowRight, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getInquiryById } from "@/lib/data/inquiries";
import { getBusinessContext } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InquiryActions from "@/components/inquiries/InquiryActions";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-amber-100 text-amber-700 border-amber-200",
    contacted: "bg-blue-100 text-blue-700 border-blue-200",
    converted: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <Badge variant="outline" className={`capitalize ${map[status] || ""}`}>{status}</Badge>
  );
}

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();
  const inquiry = await getInquiryById(businessId, id);
  if (!inquiry) notFound();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href="/inquiries">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mr-auto">
          <Link href="/inquiries" className="hover:text-foreground transition-colors">Inquiries</Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{inquiry.customer_name || "Unknown"}</span>
        </div>
        <StatusBadge status={inquiry.status ?? "new"} />
      </div>

      {/* Customer info */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Customer</h2>
        <div className="space-y-2">
          <p className="font-semibold text-lg">{inquiry.customer_name || "—"}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {inquiry.customer_phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {inquiry.customer_phone}
              </span>
            )}
            {inquiry.customer_email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {inquiry.customer_email}
              </span>
            )}
          </div>
          {inquiry.contact_method && (
            <p className="text-sm text-muted-foreground">
              Preferred contact: <span className="capitalize font-medium">{inquiry.contact_method}</span>
            </p>
          )}
        </div>
      </div>

      {/* Product requested */}
      {(inquiry.products || inquiry.preferred_size || inquiry.special_requests) && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Request Details</h2>
          {inquiry.products && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{inquiry.products.name}</p>
                {inquiry.preferred_size && (
                  <p className="text-sm text-muted-foreground">Size: {inquiry.preferred_size}</p>
                )}
              </div>
            </div>
          )}
          {inquiry.special_requests && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Special Requests</p>
              <p className="text-sm bg-muted/40 rounded-lg p-3 border border-border">{inquiry.special_requests}</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Timeline</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="font-medium">Inquiry submitted</p>
              <p className="text-muted-foreground text-xs">
                {inquiry.created_at ? format(new Date(inquiry.created_at), "MMM d, yyyy 'at' HH:mm") : "—"}
              </p>
            </div>
          </div>

          {inquiry.contacted_at && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="font-medium">Marked as contacted</p>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(inquiry.contacted_at), "MMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
            </div>
          )}

          {inquiry.status === "converted" && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="font-medium">Converted to order</p>
                {inquiry.converted_order_id && (
                  <Link
                    href={`/orders/${inquiry.converted_order_id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View order
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {inquiry.staff_notes && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Staff Notes</p>
            <p className="text-sm bg-muted/40 rounded-lg p-3 border border-border">{inquiry.staff_notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <InquiryActions inquiry={inquiry} />
    </div>
  );
}
