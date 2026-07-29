"use client";

import { useMemo, useTransition } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { DataTable } from "@/components/layout/DataTable";
import OrderStatusBadge from "./OrderStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteOrder } from "@/app/actions/orders";
import type { OrderStatus } from "@/lib/types/database";

interface OrderListProps {
  initialOrders: any[];
}

export default function OrderList({ initialOrders }: OrderListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Realtime hook or state logic could go here; for now, we just pass initialOrders to DataTable
  const orders = initialOrders;

  const handleViewOrder = (order: any) => {
    router.push(`/orders/${order.id}`);
  };

  const handleDeleteOrder = (id: string, orderNumber: string) => {
    if (!window.confirm(`Delete order "${orderNumber}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteOrder(id);
      if (result.success) {
        toast.success("Order deleted");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete order");
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "order_number",
        header: "Order #",
        cell: ({ row }: any) => <span className="font-semibold text-foreground tracking-tight">{row.getValue("order_number")}</span>,
      },
      {
        accessorKey: "customers.name",
        header: "Customer",
        id: "customer_name",
        cell: ({ row }: any) => <span className="text-secondary-foreground">{row.original.customers?.name || 'Walk-in'}</span>
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => {
          const status = row.getValue("status") as OrderStatus;
          return <OrderStatusBadge status={status || 'enquiry'} />;
        },
      },
      {
        accessorKey: "total_cost",
        header: "Amount",
        cell: ({ row }: any) => {
          const amount = parseFloat(row.getValue("total_cost") || "0");
          return (
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat("en-ZM", {
                style: "currency",
                currency: "ZMW",
              }).format(amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }: any) => {
          const date = row.getValue("due_date");
          if (!date) return <span className="text-muted-foreground opacity-50">Not Set</span>;
          
          const isOverdue = new Date(date) < new Date() && !['completed', 'delivered'].includes(row.getValue("status"));
          return (
            <span className={isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}>
              {format(new Date(date), "MMM d, yyyy")}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }: any) => {
          const order = row.original;
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
                  <DropdownMenuLabel>Order Options</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleViewOrder(order)} className="cursor-pointer">
                    <Eye size={14} className="mr-2 text-primary" />
                    <span>View order details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}/edit`)} className="cursor-pointer">
                    <Pencil size={14} className="mr-2 text-foreground" />
                    <span>Edit order</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteOrder(order.id, order.order_number)}
                    disabled={isPending}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 size={14} className="mr-2" />
                    <span>Delete order</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }
      },
    ],
    [router, isPending]
  );

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-700 delay-150 fill-mode-backwards">
      <DataTable
        columns={columns}
        data={orders}
        filterColumn="order_number"
        searchPlaceholder="Find by order number..."
        onRowClick={handleViewOrder}
      />
    </div>
  );
}
