"use client";

import { useMemo, useTransition } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Clipboard, Pencil, Trash2, Eye, Ruler, User } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { DataTable } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { deleteCustomerAction } from "@/app/actions/customers";

interface CustomerListProps {
  initialCustomers: any[];
}

export default function CustomerList({ initialCustomers }: CustomerListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleViewCustomer = (customer: any) => {
    router.push(`/customers/${customer.id}`);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the customer "${name}"? This action cannot be undone.`)) {
      startTransition(async () => {
        const result = await deleteCustomerAction(id);
        if (result.success) {
          toast.success("Customer deleted securely");
        } else {
          toast.error(`Failed to delete customer: ${result.message}`);
        }
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
              {row.getValue("name") ? (row.getValue("name") as string).charAt(0).toUpperCase() : <User size={14} />}
            </div>
            <span className="font-semibold text-foreground tracking-tight">{row.getValue("name") || "Walk-in"}</span>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }: any) => <span className="text-muted-foreground font-medium">{row.getValue("phone") || "—"}</span>
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }: any) => <span className="text-muted-foreground">{row.getValue("email") || "—"}</span>
      },
      {
        id: "measurements",
        header: "Measurements",
        cell: ({ row }: any) => {
          const hasMeasurements = !!row.original.measurements;
          return hasMeasurements ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 shadow-sm">
              <Ruler className="w-3 h-3 mr-1.5" /> Filed
            </Badge>
          ) : (
             <span className="text-muted-foreground text-xs font-semibold px-2 py-1 bg-muted rounded-full">Missing</span>
          );
        }
      },
      {
        accessorKey: "created_at",
        header: "Joined",
        cell: ({ row }: any) => {
          const date = row.getValue("created_at");
          return date ? (
             <span className="text-muted-foreground">
                {format(new Date(date), "MMM d, yyyy")}
             </span>
          ) : "—";
        },
      },
      {
        id: "actions",
        cell: ({ row }: any) => {
          const customer = row.original;
          return (
            <div className="flex justify-end pr-2 gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewCustomer(customer); }} className="hidden md:flex text-primary hover:text-primary hover:bg-primary/10 h-8">
                 View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/80">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleViewCustomer(customer)} className="cursor-pointer">
                    <Eye size={14} className="mr-2 text-primary" />
                    <span>View profile & orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}/edit`)} className="cursor-pointer">
                    <Pencil size={14} className="mr-2 text-foreground" />
                    <span>Edit contact info</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)} 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    disabled={isPending}
                  >
                    <Trash2 size={14} className="mr-2" />
                    <span>Delete customer</span>
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
        data={initialCustomers}
        filterColumn="name"
        searchPlaceholder="Find customer by name..."
        onRowClick={handleViewCustomer}
      />
    </div>
  );
}
