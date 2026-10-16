"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Send, Trash2, Check, X, ArrowRightLeft, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentStatusBadge from "./DocumentStatusBadge";
import {
  sendDocumentEmailAction,
  updateDocumentStatusAction,
  deleteDocumentAction,
  recordDocumentPaymentAction,
  convertQuotationToInvoiceAction,
} from "@/app/actions/documents";

export default function DocumentDetailView({ document }: { document: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const isQuotation = document.type === "quotation";
  const subtotal = parseFloat(document.subtotal || "0");
  const taxAmount = parseFloat(document.tax_amount || "0");
  const total = parseFloat(document.total || "0");
  const amountPaid = parseFloat(document.amount_paid || "0");
  const balance = total - amountPaid;

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendDocumentEmailAction(document.id);
      if (result.success) {
        toast.success("Email sent");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to send email");
      }
    });
  };

  const handleStatus = (status: string) => {
    startTransition(async () => {
      const result = await updateDocumentStatusAction(document.id, status);
      if (result.success) {
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update status");
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete ${document.document_number}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteDocumentAction(document.id);
      if (result.success) {
        toast.success("Document deleted");
        router.push("/documents");
      } else {
        toast.error(result.message || "Failed to delete document");
      }
    });
  };

  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertQuotationToInvoiceAction(document.id);
      if (result.success) {
        toast.success("Converted to invoice");
        router.push(`/documents/${result.documentId}`);
      } else {
        toast.error(result.message || "Failed to convert");
      }
    });
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount || "0");
    if (amount <= 0) {
      toast.error("Enter a payment amount");
      return;
    }
    startTransition(async () => {
      const result = await recordDocumentPaymentAction(document.id, amount, paymentMethod || undefined);
      if (result.success) {
        toast.success("Payment recorded");
        setShowPaymentDialog(false);
        setPaymentAmount("");
        setPaymentMethod("");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to record payment");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{document.document_number}</h1>
          <DocumentStatusBadge status={document.status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSend} disabled={isPending} className="gap-1.5">
            <Send size={14} /> Email {isQuotation ? "Quotation" : "Invoice"}
          </Button>
          {isQuotation && document.status === "sent" && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatus("accepted")} disabled={isPending} className="gap-1.5">
                <Check size={14} /> Accepted
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleStatus("declined")} disabled={isPending} className="gap-1.5">
                <X size={14} /> Declined
              </Button>
            </>
          )}
          {isQuotation && document.status === "accepted" && (
            <Button size="sm" onClick={handleConvert} disabled={isPending} className="gap-1.5">
              <ArrowRightLeft size={14} /> Convert to Invoice
            </Button>
          )}
          {!isQuotation && balance > 0 && (
            <Button size="sm" onClick={() => setShowPaymentDialog(true)} disabled={isPending} className="gap-1.5">
              <Banknote size={14} /> Record Payment
            </Button>
          )}
          {document.status === "draft" && (
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={isPending} className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-5">
        <div className="flex justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">To</p>
            <p className="text-sm font-medium">{document.recipient_name}</p>
            {(document.recipient_email || document.customers?.email) && (
              <p className="text-xs text-muted-foreground">{document.recipient_email || document.customers?.email}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Issued</p>
            <p className="text-sm">{format(new Date(document.issue_date), "d MMM yyyy")}</p>
            {isQuotation && document.valid_until && (
              <p className="text-xs text-muted-foreground mt-1">Valid until {format(new Date(document.valid_until), "d MMM yyyy")}</p>
            )}
            {!isQuotation && document.due_date && (
              <p className="text-xs text-muted-foreground mt-1">Due {format(new Date(document.due_date), "d MMM yyyy")}</p>
            )}
          </div>
        </div>

        {document.description && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{document.description}</p>
          </div>
        )}

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-3 py-2 border-b border-border grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Unit Price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {(document.items || []).map((item: any) => (
            <div key={item.id} className="px-3 py-2.5 border-b border-border last:border-0 grid grid-cols-12 gap-2 items-center text-sm">
              <div className="col-span-6">{item.description}</div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-2 text-right">K{parseFloat(item.unit_price).toFixed(2)}</div>
              <div className="col-span-2 text-right font-medium">K{(parseFloat(item.unit_price) * parseFloat(item.quantity)).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2 text-sm ml-auto max-w-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>K{subtotal.toFixed(2)}</span>
          </div>
          {parseFloat(document.tax_rate || "0") > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax ({document.tax_rate}%)</span><span>K{taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-border my-1" />
          <div className="flex justify-between font-semibold text-primary">
            <span>Total</span><span>K{total.toFixed(2)}</span>
          </div>
          {!isQuotation && amountPaid > 0 && (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span><span>K{amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Balance</span>
                <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>K{balance.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {document.payments?.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Payments</p>
            <div className="border border-border rounded-lg divide-y divide-border">
              {document.payments.map((p: any) => (
                <div key={p.id} className="px-3 py-2 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{format(new Date(p.paid_at), "d MMM yyyy")}{p.method ? ` · ${p.method}` : ""}</span>
                  <span className="font-medium">K{parseFloat(p.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="payment_amount">Amount (K) *</Label>
              <Input id="payment_amount" type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1" placeholder={balance.toFixed(2)} />
            </div>
            <div>
              <Label htmlFor="payment_method">Method</Label>
              <Input id="payment_method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1" placeholder="Cash, bank transfer, mobile money..." />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleRecordPayment} loading={isPending}>Record Payment</Button>
              <Button variant="ghost" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
