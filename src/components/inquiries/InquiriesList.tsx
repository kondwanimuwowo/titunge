"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Package,
  Phone,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { markInquiryContactedAction, deleteInquiryAction } from "@/app/actions/inquiries";

type FilterType = "all" | "new" | "contacted" | "converted";

interface InquiriesListProps {
  initialInquiries: any[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "new") {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        New
      </Badge>
    );
  }
  if (status === "contacted") {
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
        Contacted
      </Badge>
    );
  }
  if (status === "converted") {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
        Converted
      </Badge>
    );
  }
  return <Badge variant="outline" className="">{status}</Badge>;
}

function ContactMethodBadge({ method }: { method?: string }) {
  if (!method) return null;
  return (
    <Badge variant="outline" className="capitalize text-xs">
      {method}
    </Badge>
  );
}

export default function InquiriesList({ initialInquiries }: InquiriesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inquiries, setInquiries] = useState<any[]>(initialInquiries);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("customer_inquiries_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_inquiries" },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleMarkContacted = (inquiry: any) => {
    startTransition(async () => {
      const result = await markInquiryContactedAction(inquiry.id);
      if (result.success) {
        setInquiries((prev) =>
          prev.map((i) =>
            i.id === inquiry.id ? { ...i, status: "contacted" } : i
          )
        );
        toast.success("Inquiry marked as contacted.");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update inquiry.");
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    startTransition(async () => {
      const result = await deleteInquiryAction(id);
      if (result.success) {
        setInquiries((prev) => prev.filter((i) => i.id !== id));
        toast.success("Inquiry deleted.");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete inquiry.");
      }
    });
  };

  const handleConvert = (inquiry: any) => {
    const params = new URLSearchParams({ inquiry_id: inquiry.id });
    router.push(`/orders/new?${params.toString()}`);
  };

  const filtered =
    filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    contacted: inquiries.filter((i) => i.status === "contacted").length,
    converted: inquiries.filter((i) => i.status === "converted").length,
  };

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "new", label: `New (${counts.new})` },
    { key: "contacted", label: `Contacted (${counts.contacted})` },
    { key: "converted", label: `Converted (${counts.converted})` },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List card */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="text-muted-foreground" size={20} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              No inquiries
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "all"
                ? "No inquiries have been submitted yet."
                : `No ${filter} inquiries.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-4 flex gap-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                onClick={() => router.push(`/inquiries/${inquiry.id}`)}
              >
                {/* Product image or placeholder */}
                <div className="flex-shrink-0">
                  {inquiry.products?.image_url ? (
                    <img
                      src={inquiry.products.image_url}
                      alt={inquiry.products.name || "Product"}
                      className="w-10 h-10 rounded-md object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border">
                      <Package size={16} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Middle: customer + inquiry info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {inquiry.customer_name || "Unknown Customer"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[inquiry.customer_phone, inquiry.customer_email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {inquiry.products?.name && (
                    <p className="text-xs text-muted-foreground">
                      {inquiry.products.name}
                      {inquiry.preferred_size
                        ? ` · Size: ${inquiry.preferred_size}`
                        : ""}
                    </p>
                  )}
                  {inquiry.special_requests && (
                    <p className="text-xs text-muted-foreground italic line-clamp-1">
                      {inquiry.special_requests}
                    </p>
                  )}
                </div>

                {/* Right: badges + date + actions */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={inquiry.status} />
                    <ContactMethodBadge method={inquiry.contact_method} />
                  </div>
                  {inquiry.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {inquiry.status === "new" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={isPending}
                        onClick={() => handleMarkContacted(inquiry)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title="Mark as contacted"
                      >
                        <Phone size={13} className="mr-1" />
                        Contacted
                      </Button>
                    )}

                    {(inquiry.status === "new" ||
                      inquiry.status === "contacted") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConvert(inquiry)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title="Convert to order"
                      >
                        <ArrowRight size={13} className="mr-1" />
                        Convert
                      </Button>
                    )}

                    {inquiry.status === "converted" && (
                      <span className="text-xs text-emerald-600 font-medium px-1">
                        Converted
                      </span>
                    )}

                    <button
                      onClick={(e) => handleDelete(e, inquiry.id)}
                      disabled={isPending}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete inquiry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
