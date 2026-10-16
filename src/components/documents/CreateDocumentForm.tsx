"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FileText, Receipt, Search, Plus, Trash2, Check, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createDocumentAction } from "@/app/actions/documents";
import type { DocumentItemInput } from "@/lib/documentItems";
import type { DocumentType } from "@/lib/types/database";

interface BasketItem extends DocumentItemInput {
  key: string;
}

interface Props {
  customers: any[];
  financialSettings: any;
  defaultType: DocumentType;
}

export default function CreateDocumentForm({ customers, financialSettings, defaultType }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [docType, setDocType] = useState<DocumentType>(defaultType);

  const [recipientMode, setRecipientMode] = useState<"customer" | "adhoc">("customer");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [itemDescription, setItemDescription] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState("");

  const { register, watch } = useForm({
    defaultValues: {
      recipient_name: "",
      recipient_email: "",
      valid_until: "",
      due_date: "",
      description: "",
      notes: "",
      tax_rate: String(financialSettings?.tax_rate ?? 0),
    },
  });

  const filteredCustomers = customerSearch
    ? customers.filter(
        (c: any) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          (c.phone && c.phone.includes(customerSearch))
      )
    : customers;

  const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId) || null;

  const taxRate = parseFloat(watch("tax_rate") || "0");
  const subtotal = basket.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleAddItem = () => {
    if (!itemDescription.trim() || parseFloat(itemUnitPrice || "0") <= 0) {
      toast.error("Add a description and a price");
      return;
    }
    setBasket((prev) => [
      ...prev,
      { key: `${Date.now()}-${Math.random()}`, description: itemDescription.trim(), quantity: itemQty || 1, unit_price: parseFloat(itemUnitPrice || "0") },
    ]);
    setItemDescription("");
    setItemQty(1);
    setItemUnitPrice("");
  };

  const handleRemoveItem = (key: string) => {
    setBasket((prev) => prev.filter((i) => i.key !== key));
  };

  const handleSubmit = () => {
    const values = { recipient_name: watch("recipient_name"), recipient_email: watch("recipient_email"), valid_until: watch("valid_until"), due_date: watch("due_date"), description: watch("description"), notes: watch("notes") };

    const recipientName = recipientMode === "customer" ? selectedCustomer?.name : values.recipient_name;
    if (!recipientName?.trim()) {
      toast.error(recipientMode === "customer" ? "Select a customer" : "Enter a recipient name");
      return;
    }
    if (basket.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setSubmitting(true);
    createDocumentAction({
      type: docType,
      customer_id: recipientMode === "customer" ? selectedCustomerId : null,
      recipient_name: recipientName.trim(),
      recipient_email: recipientMode === "customer" ? selectedCustomer?.email || null : values.recipient_email || null,
      valid_until: values.valid_until || null,
      due_date: values.due_date || null,
      description: values.description || null,
      notes: values.notes || null,
      tax_rate: taxRate,
      items: basket.map((item) => ({ description: item.description, quantity: item.quantity, unit_price: item.unit_price })),
    }).then((result) => {
      setSubmitting(false);
      if (result.success) {
        toast.success(`${docType === "quotation" ? "Quotation" : "Invoice"} created`);
        router.push(`/documents/${result.documentId}`);
      } else {
        toast.error(result.message || "Failed to create document");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Type toggle */}
      <div className="flex gap-2">
        {(["quotation", "invoice"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setDocType(type)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
              docType === type
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40 bg-card"
            )}
          >
            {type === "quotation" ? <FileText size={14} /> : <Receipt size={14} />}
            {type === "quotation" ? "Quotation" : "Invoice"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-5">
        {/* Recipient */}
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <User size={16} className="text-primary" /> Recipient
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">An existing customer, or anyone else by name and email</p>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setRecipientMode("customer")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                recipientMode === "customer" ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground"
              )}
            >
              Existing customer
            </button>
            <button
              type="button"
              onClick={() => setRecipientMode("adhoc")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1",
                recipientMode === "adhoc" ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground"
              )}
            >
              <UserPlus size={12} /> Someone else
            </button>
          </div>

          {recipientMode === "customer" ? (
            <div className="space-y-2 mt-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="max-h-44 overflow-y-auto border border-border rounded-md divide-y divide-border">
                {filteredCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-4 text-center">No customers found</p>
                ) : (
                  filteredCustomers.map((c: any) => {
                    const selected = selectedCustomerId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                          selected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{c.name}</p>
                          {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                        </div>
                        {selected && <Check size={14} className="text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <Label htmlFor="recipient_name" className="text-xs">Name *</Label>
                <Input id="recipient_name" {...register("recipient_name")} className="mt-1 h-9" />
              </div>
              <div>
                <Label htmlFor="recipient_email" className="text-xs">Email</Label>
                <Input id="recipient_email" type="email" {...register("recipient_email")} className="mt-1 h-9" placeholder="For sending the document" />
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="pt-4 border-t border-border">
          <h2 className="text-base font-semibold">Items</h2>
          <div className="border border-dashed border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3 mt-3">
            <div>
              <Label className="text-xs">Description *</Label>
              <Input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className="mt-1 h-9 bg-card" placeholder="e.g. Tailored suit, alterations..." />
            </div>
            <div className="flex items-end gap-3">
              <div className="w-24">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min="1" step="1" value={itemQty} onChange={(e) => setItemQty(parseInt(e.target.value, 10) || 1)} className="mt-1 h-9 bg-card" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Unit Price (K) *</Label>
                <Input type="number" min="0" step="0.01" value={itemUnitPrice} onChange={(e) => setItemUnitPrice(e.target.value)} className="mt-1 h-9 bg-card" />
              </div>
              <Button type="button" onClick={handleAddItem} className="gap-1.5 h-9">
                <Plus size={14} /> Add
              </Button>
            </div>
          </div>

          {basket.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden mt-3">
              <div className="bg-muted/30 px-3 py-2 border-b border-border grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Unit Price</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-1" />
              </div>
              {basket.map((item) => (
                <div key={item.key} className="px-3 py-2.5 border-b border-border last:border-0 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 text-sm font-medium">{item.description}</div>
                  <div className="col-span-2 text-center text-sm">{item.quantity}</div>
                  <div className="col-span-2 text-right text-sm">K{item.unit_price.toFixed(2)}</div>
                  <div className="col-span-1 text-right text-sm font-semibold text-primary">K{(item.unit_price * item.quantity).toFixed(2)}</div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => handleRemoveItem(item.key)} className="p-1 text-muted-foreground hover:text-destructive rounded">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg py-6 text-center text-muted-foreground text-sm mt-3">
              No items added yet
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          {docType === "quotation" ? (
            <div>
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input id="valid_until" type="date" {...register("valid_until")} className="mt-1" />
            </div>
          ) : (
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register("due_date")} className="mt-1" />
            </div>
          )}
          <div>
            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
            <Input id="tax_rate" type="number" min="0" step="0.01" {...register("tax_rate")} className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea id="description" {...register("description")} rows={2}
            placeholder="What this document covers..."
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>

        <div>
          <Label htmlFor="notes">Internal Notes</Label>
          <textarea id="notes" {...register("notes")} rows={2}
            placeholder="Notes visible to staff only..."
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>

        {/* Totals */}
        <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2 text-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Subtotal</span>
            <span>K{subtotal.toFixed(2)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Tax ({taxRate}%)</span>
              <span>K{taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-border my-1" />
          <div className="flex justify-between items-center font-semibold text-primary">
            <span>Total</span>
            <span>K{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="button" onClick={handleSubmit} loading={submitting}>
          {submitting ? "Creating..." : `Create ${docType === "quotation" ? "Quotation" : "Invoice"}`}
        </Button>
      </div>
    </div>
  );
}
