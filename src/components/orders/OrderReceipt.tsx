import { format } from "date-fns";
import { Scissors } from "lucide-react";

interface OrderReceiptProps {
  order: any;
  taxRate: number;
}

export default function OrderReceipt({ order, taxRate }: OrderReceiptProps) {
  const subtotal = parseFloat(order.total_cost || "0");
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;
  const deposit = parseFloat(order.deposit || "0");
  const balance = grandTotal - deposit;

  return (
    <div className="bg-card border border-border rounded-xl p-8 max-w-2xl mx-auto print:border-0 print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Scissors className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">GLORIAZ DAUGHTER</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Tailoring &amp; Garments</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">Receipt</p>
          <p className="text-xs text-muted-foreground">{order.order_number}</p>
        </div>
      </div>

      {/* Customer + Date */}
      <div className="grid grid-cols-2 gap-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Billed To</p>
          <p className="text-sm font-medium text-foreground">{order.customers?.name || "Walk-in Customer"}</p>
          {order.customers?.phone && (
            <p className="text-xs text-muted-foreground">{order.customers.phone}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Date</p>
          <p className="text-sm text-foreground">
            {format(new Date(order.order_date || order.created_at), "d MMMM yyyy")}
          </p>
          {order.due_date && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Due: {format(new Date(order.due_date), "d MMMM yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {order.description && (
        <div className="py-4 border-t border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Description</p>
          <p className="text-sm text-foreground">{order.description}</p>
        </div>
      )}

      {/* Materials */}
      {order.materials && order.materials.length > 0 && (
        <div className="py-4 border-t border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Materials Used</p>
          <div className="space-y-1">
            {order.materials.map((m: any, i: number) => (
              <p key={i} className="text-sm text-foreground">
                {m.materials?.name} — {parseFloat(m.quantity_used).toFixed(2)} {m.materials?.unit}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="py-4 border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">K{subtotal.toFixed(2)}</span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
            <span className="text-foreground">K{taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">K{grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1">
          <span className="text-muted-foreground">Deposit Paid</span>
          <span className="text-foreground">K{deposit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>Balance Due</span>
          <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>K{balance.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pt-6 border-t border-border mt-4">
        Thank you for your business.
      </p>
    </div>
  );
}
