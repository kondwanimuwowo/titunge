"use client";

import { useMemo, useTransition } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Eye, Send, ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { DataTable } from "@/components/layout/DataTable";
import DocumentStatusBadge from "./DocumentStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDocumentAction, sendDocumentEmailAction, convertQuotationToInvoiceAction } from "@/app/actions/documents";
import type { DocumentStatus } from "@/lib/types/database";

interface DocumentListProps {
  documents: any[];
  type: "quotation" | "invoice";
}

export default function DocumentList({ documents, type }: DocumentListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleView = (doc: any) => router.push(`/documents/${doc.id}`);

  const handleDelete = (id: string, documentNumber: string) => {
    if (!window.confirm(`Delete ${documentNumber}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteDocumentAction(id);
      if (result.success) {
        toast.success("Document deleted");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete document");
      }
    });
  };

  const handleSend = (id: string) => {
    startTransition(async () => {
      const result = await sendDocumentEmailAction(id);
      if (result.success) {
        toast.success("Email sent");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to send email");
      }
    });
  };

  const handleConvert = (id: string) => {
    startTransition(async () => {
      const result = await convertQuotationToInvoiceAction(id);
      if (result.success) {
        toast.success("Converted to invoice");
        router.push(`/documents/${result.documentId}`);
      } else {
        toast.error(result.message || "Failed to convert");
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "document_number",
        header: type === "quotation" ? "Quotation #" : "Invoice #",
        cell: ({ row }: any) => <span className="font-semibold text-foreground tracking-tight">{row.getValue("document_number")}</span>,
      },
      {
        accessorKey: "recipient_name",
        header: "Recipient",
        cell: ({ row }: any) => <span className="text-secondary-foreground">{row.getValue("recipient_name")}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => <DocumentStatusBadge status={(row.getValue("status") as DocumentStatus) || "draft"} />,
      },
      {
        accessorKey: "total",
        header: "Amount",
        cell: ({ row }: any) => (
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat("en-ZM", { style: "currency", currency: "ZMW" }).format(parseFloat(row.getValue("total") || "0"))}
          </span>
        ),
      },
      {
        accessorKey: type === "quotation" ? "valid_until" : "due_date",
        header: type === "quotation" ? "Valid Until" : "Due Date",
        cell: ({ row }: any) => {
          const date = row.getValue(type === "quotation" ? "valid_until" : "due_date");
          if (!date) return <span className="text-muted-foreground opacity-50">Not set</span>;
          return <span className="text-muted-foreground">{format(new Date(date), "MMM d, yyyy")}</span>;
        },
      },
      {
        id: "actions",
        cell: ({ row }: any) => {
          const doc = row.original;
          return (
            <div className="flex justify-end pr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/80">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleView(doc)} className="cursor-pointer">
                    <Eye size={14} className="mr-2 text-primary" />
                    <span>View details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSend(doc.id)} disabled={isPending} className="cursor-pointer">
                    <Send size={14} className="mr-2 text-foreground" />
                    <span>Email {type === "quotation" ? "quotation" : "invoice"}</span>
                  </DropdownMenuItem>
                  {type === "quotation" && doc.status === "accepted" && (
                    <DropdownMenuItem onClick={() => handleConvert(doc.id)} disabled={isPending} className="cursor-pointer">
                      <ArrowRightLeft size={14} className="mr-2 text-foreground" />
                      <span>Convert to invoice</span>
                    </DropdownMenuItem>
                  )}
                  {doc.status === "draft" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(doc.id, doc.document_number)}
                        disabled={isPending}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 size={14} className="mr-2" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, isPending, type]
  );

  return (
    <div className="bg-card border border-border rounded-xl shadow-md overflow-hidden animate-in fade-in duration-700 delay-150 fill-mode-backwards">
      <DataTable
        columns={columns}
        data={documents}
        filterColumn="document_number"
        searchPlaceholder={`Find by ${type === "quotation" ? "quotation" : "invoice"} number...`}
        onRowClick={handleView}
      />
    </div>
  );
}
