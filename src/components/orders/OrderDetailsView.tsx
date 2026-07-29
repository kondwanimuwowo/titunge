"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { format, differenceInDays, isPast } from "date-fns";
import {
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Package,
  Scissors,
  FileText,
  Edit,
  Printer,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Loader2,
  Clock,
  Ruler,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrderContextPanel from "./OrderContextPanel";
import BillOfMaterialsEditor from "./BillOfMaterialsEditor";
import CancelOrderDialog from "./CancelOrderDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OrderStatusBadge from "./OrderStatusBadge";
import { StatusTimeline } from "./StatusTimeline";
import { updateOrderStatus } from "@/app/actions/orders";
import type { OrderStatus } from "@/lib/types/database";

const STATUS_FLOW: OrderStatus[] = [
  "enquiry",
  "contacted",
  "measurements",
  "production",
  "fitting",
  "completed",
  "delivered",
];

interface OrderDetailsProps {
  order: any;
  availableMaterials?: any[];
}

export default function OrderDetailsView({ order, availableMaterials = [] }: OrderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusNotes, setStatusNotes] = useState("");

  const getNextStatus = (): OrderStatus | null => {
    const currentIndex = STATUS_FLOW.indexOf(order.status as OrderStatus);
    return currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIndex + 1]
      : null;
  };

  const handleStatusChange = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return;

    startTransition(async () => {
      const result = await updateOrderStatus(order.id, nextStatus, statusNotes);
      if (result.success) {
        toast.success(`Order moved to ${nextStatus}`);
        setStatusNotes("");
      } else {
        toast.error(`Failed to update status: ${result.message}`);
      }
    });
  };

  const nextStatus = getNextStatus();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-backwards">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {order.order_number}
            <OrderStatusBadge status={order.status as OrderStatus} />
          </h2>
          <p className="text-muted-foreground mt-1">
            Created on {format(new Date(order.order_date || order.created_at), "MMMM dd, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          {!["cancelled", "delivered"].includes(order.status) && (
            <CancelOrderDialog
              orderId={order.id}
              orderNumber={order.order_number}
              stockWillRestore={["production", "fitting", "completed"].includes(order.status)}
            />
          )}
          <Button variant="outline" onClick={() => router.push(`/orders/${order.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Order
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/orders/${order.id}/receipt`)} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Smart banners */}
      {(() => {
        const alerts: React.ReactNode[] = [];
        const dueDate = order.due_date ? new Date(order.due_date) : null;
        const isActive = !["completed","delivered","cancelled"].includes(order.status);

        if (dueDate && isActive) {
          const daysLeft = differenceInDays(dueDate, new Date());
          if (isPast(dueDate)) {
            alerts.push(
              <div key="overdue" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-300 bg-red-50 text-red-800 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Overdue</strong> — was due {format(dueDate, "d MMM yyyy")} ({Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? "s" : ""} ago)
                </span>
              </div>
            );
          } else if (daysLeft <= 3) {
            alerts.push(
              <div key="due-soon" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Due soon</strong> — {daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`} ({format(dueDate, "d MMM yyyy")})
                </span>
              </div>
            );
          }
        }

        if (order.status === "measurements" && !order.customers?.measurements) {
          alerts.push(
            <div key="no-measurements" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm">
              <Ruler className="h-4 w-4 shrink-0" />
              <span>
                <strong>Measurements needed</strong> — enter {order.customers?.name ? `${order.customers.name}'s` : "customer"} measurements before moving to production.
              </span>
            </div>
          );
        }

        return alerts.length > 0 ? <div className="space-y-2">{alerts}</div> : null;
      })()}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Customer Information
                  </span>
                  {order.customers?.id && (
                    <Link
                      href={`/customers/${order.customers.id}`}
                      title="View customer profile"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Name</p>
                  <p className="font-medium text-foreground text-lg">
                    {order.customers?.name || "Walk-in Customer"}
                  </p>
                </div>
                {order.customers?.phone && (
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Phone size={14} className="text-primary" />
                    </div>
                    <p className="text-foreground">{order.customers.phone}</p>
                  </div>
                )}
                {order.customers?.email && (
                  <div className="flex items-center gap-3">
                     <div className="bg-primary/10 p-2 rounded-full">
                      <Mail size={14} className="text-primary" />
                    </div>
                    <p className="text-foreground">{order.customers.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Order Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Description</p>
                  <p className="text-foreground leading-relaxed">
                    {order.description || "No description provided"}
                  </p>
                </div>

                {order.notes && (
                  <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Internal Notes</p>
                    <p className="text-foreground text-sm italic">{order.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Due Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <p className="font-semibold text-foreground">
                        {order.due_date
                          ? format(new Date(order.due_date), "MMM dd, yyyy")
                          : "Not set"}
                      </p>
                    </div>
                  </div>

                  {order.employees && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Tailor
                      </p>
                      <div className="flex items-center gap-2">
                        <Scissors size={16} className="text-primary" />
                        <p className="font-semibold text-foreground">
                          {order.employees.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bill of Materials (editable) */}
          <BillOfMaterialsEditor
            orderId={order.id}
            orderStatus={order.status}
            initialMaterials={order.materials || []}
            availableMaterials={availableMaterials.map((m: any) => ({
              id: m.id,
              name: m.name,
              unit: m.unit,
              cost_per_unit: parseFloat(String(m.cost_per_unit || 0)),
            }))}
          />

          {/* Pricing & Profitability */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Financial Review
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground tracking-tight">Cost Breakdown</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={14} className="text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">Production Costs:</p>
                          <ul className="text-xs space-y-1 ml-2 list-disc">
                            <li>Materials: Fabrics & accessories</li>
                            <li>Labour: Tailor's time manually attributed</li>
                            <li>Overhead: Business expenses padded</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="bg-muted/20 rounded-xl p-5 border border-border/60 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Materials</span>
                      <span className="font-semibold text-foreground">K{parseFloat(order.material_cost || "0").toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Labour</span>
                      <span className="font-semibold text-foreground">K{parseFloat(order.labour_cost || "0").toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Overhead</span>
                      <span className="font-semibold text-foreground">K{parseFloat(order.overhead_cost || "0").toFixed(2)}</span>
                    </div>

                    <div className="pt-3 mt-1 border-t border-border/60">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">Base Cost</span>
                        <span className="text-lg font-bold text-foreground">
                          K{(
                            parseFloat(order.material_cost || "0") +
                            parseFloat(order.labour_cost || "0") +
                            parseFloat(order.overhead_cost || "0")
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selling Price & Profit */}
                <div className="space-y-4">
                   <h3 className="font-semibold text-foreground tracking-tight">Revenue & Margins</h3>
                  
                  {/* SELLING PRICE */}
                  <div className="px-5 py-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/30 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Selling Price</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      K{parseFloat(order.total_cost || "0").toFixed(2)}
                    </div>
                  </div>

                  {/* Profit Analysis */}
                  {(() => {
                    const baseCost =
                      parseFloat(order.material_cost || "0") +
                      parseFloat(order.labour_cost || "0") +
                      parseFloat(order.overhead_cost || "0");
                    const revenue = parseFloat(order.total_cost || "0");
                    const profitAmount = revenue - baseCost;
                    const markup = baseCost > 0 ? (profitAmount / baseCost) * 100 : 0;
                    const isLoss = profitAmount < 0;
                    const isLowMarkup = !isLoss && markup < 20;

                    return (
                      <div className="p-4 bg-card rounded-xl border border-border/60 shadow-sm">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground font-medium">Net Profit</span>
                          <span className={`font-bold ${isLoss ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            K{Math.abs(profitAmount).toFixed(2)}
                            {isLoss && <span className="text-xs ml-1">(LOSS)</span>}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-muted-foreground font-medium">Markup</span>
                          <span className={`font-bold ${isLoss ? 'text-destructive' : isLowMarkup ? 'text-yellow-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {markup.toFixed(1)}%
                          </span>
                        </div>
                        <div className="pt-3 border-t border-border/60">
                          {isLoss ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-destructive/90 bg-destructive/10 px-3 py-2 rounded-lg">
                              <AlertTriangle size={14} className="flex-shrink-0" />
                              <span>Critical: Sold below cost</span>
                            </div>
                          ) : isLowMarkup ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-yellow-700 bg-yellow-500/10 px-3 py-2 rounded-lg">
                              <AlertCircle size={14} className="flex-shrink-0" />
                              <span>Warning: Margins below 20%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
                              <CheckCircle size={14} className="flex-shrink-0" />
                              <span>Healthy profit margin</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Payment Split */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
                <div className="p-4 bg-muted/20 rounded-xl border border-border/40 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Deposit Paid</span>
                  <span className="font-bold text-foreground">K{parseFloat(order.deposit || "0").toFixed(2)}</span>
                </div>
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  (order.balance || 0) > 0 ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                }`}>
                  <span className={`text-sm font-bold ${
                    (order.balance || 0) > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                  }`}>Balance Due</span>
                  <span className={`text-xl font-black tracking-tight ${
                    (order.balance || 0) > 0 ? "text-red-600 dark:text-red-500" : "text-emerald-600 dark:text-emerald-500"
                  }`}>
                    K{parseFloat(order.balance || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Actions */}
        <div className="space-y-6">
          {/* Status Actions */}
          {nextStatus && order.status !== "delivered" && order.status !== "cancelled" && (
            <Card className="border-primary/30 bg-primary/5 shadow-md ring-1 ring-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Advance Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Action Log Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-xl border border-input/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    placeholder={`Notes for moving to ${nextStatus}...`}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleStatusChange}
                  loading={isPending}
                  className="w-full font-bold shadow-sm"
                  size="lg"
                >
                  Push to {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                  {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                {nextStatus === "production" && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-500 rounded-lg text-xs leading-relaxed">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Inventory Impact:</strong> Materials used in this order will be permanently deducted from stock once moved to production.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Smart Context Panel */}
          <OrderContextPanel order={order} />

          {/* Order Timeline */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                 <Clock className="w-5 h-5 text-primary" />
                 Fulfillment Line
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <StatusTimeline
                currentStatus={order.status as OrderStatus}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
