"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteEmployeeAction,
  restoreEmployeeAction,
  clockInAction,
  clockOutAction,
} from "@/app/actions/employees";
import {
  MoreHorizontal,
  Plus,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";

const ROLES = ["All Roles", "Tailor", "Cutter", "Finisher", "QC Inspector", "Supervisor", "Manager"];

interface EmployeeListProps {
  initialEmployees: (Tables<"employees"> & { active_orders_count: number })[];
  initialAttendance: any[];
}

export default function EmployeeList({ initialEmployees, initialAttendance }: EmployeeListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

  const attendanceMap = useMemo(() => {
    const map = new Map<string, any>();
    initialAttendance.forEach((r) => map.set(r.employee_id, r));
    return map;
  }, [initialAttendance]);

  const filtered = useMemo(() => {
    return initialEmployees.filter((e) => {
      if (roleFilter !== "All Roles" && e.role !== roleFilter) return false;
      if (statusFilter === "active" && !e.active) return false;
      if (statusFilter === "inactive" && e.active) return false;
      return true;
    });
  }, [initialEmployees, roleFilter, statusFilter]);

  const handleToggleActive = (id: string, name: string, currentlyActive: boolean) => {
    const action = currentlyActive ? "deactivate" : "reactivate";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${name}?`)) return;
    startTransition(async () => {
      const result = currentlyActive
        ? await deleteEmployeeAction(id)
        : await restoreEmployeeAction(id);
      if (result.success) {
        toast.success(`Employee ${action}d`);
        router.refresh();
      } else {
        toast.error(result.message || `Failed to ${action}`);
      }
    });
  };

  const handleClockInOut = (employeeId: string, action: "in" | "out") => {
    startTransition(async () => {
      const result = action === "in" ? await clockInAction(employeeId) : await clockOutAction(employeeId);
      if (result.success) {
        toast.success(action === "in" ? "Clocked in" : "Clocked out");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update");
      }
    });
  };

  const getTodayStatus = (employeeId: string) => {
    const record = attendanceMap.get(employeeId);
    if (!record) return "absent";
    if (record.clock_out) return "clocked_out";
    return "clocked_in";
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Employee",
        cell: ({ row }: any) => {
          const e = row.original;
          const initials = e.name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) ?? "?";
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{e.name}</p>
                {e.phone && (
                  <p className="text-xs text-muted-foreground truncate">{e.phone}</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: any) => (
          <Badge variant="secondary" className="text-xs font-medium">
            {row.getValue("role")}
          </Badge>
        ),
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }: any) => {
          const active = row.getValue("active");
          return (
            <Badge
              variant="secondary"
              className={`text-xs font-medium ${active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
            >
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "today",
        header: "Today",
        cell: ({ row }: any) => {
          const status = getTodayStatus(row.original.id);
          const record = attendanceMap.get(row.original.id);
          const label =
            status === "clocked_in" ? "Clocked In" : status === "clocked_out" ? "Clocked Out" : "Absent";
          const color =
            status === "clocked_in"
              ? "bg-green-50 text-green-700"
              : status === "clocked_out"
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-500";
          return (
            <div className="space-y-0.5">
              <Badge variant="secondary" className={`text-xs ${color}`}>{label}</Badge>
              {record?.clock_in && (
                <p className="text-[11px] text-muted-foreground">
                  {new Date(record.clock_in).toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}
                  {record.clock_out && ` — ${new Date(record.clock_out).toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "hire_date",
        header: "Hired",
        cell: ({ row }: any) => {
          const d = row.getValue("hire_date");
          return d ? (
            <span className="text-sm text-muted-foreground">{format(new Date(d), "dd MMM yyyy")}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "hourly_rate",
        header: "Rate (K/hr)",
        cell: ({ row }: any) => {
          const rate = row.getValue("hourly_rate");
          return rate != null ? (
            <span className="text-sm font-medium">K{parseFloat(String(rate)).toFixed(2)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }: any) => {
          const e = row.original;
          const status = getTodayStatus(e.id);
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push(`/employees/${e.id}`)} className="cursor-pointer">
                  <Eye className="h-4 w-4 mr-2" /> View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/employees/${e.id}/edit`)} className="cursor-pointer">
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {status === "absent" && e.active && (
                  <DropdownMenuItem onClick={() => handleClockInOut(e.id, "in")} className="cursor-pointer">
                    <LogIn className="h-4 w-4 mr-2" /> Clock In
                  </DropdownMenuItem>
                )}
                {status === "clocked_in" && (
                  <DropdownMenuItem onClick={() => handleClockInOut(e.id, "out")} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Clock Out
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {e.active ? (
                  <DropdownMenuItem
                    onClick={() => handleToggleActive(e.id, e.name, true)}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <UserX className="h-4 w-4 mr-2" /> Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleToggleActive(e.id, e.name, false)}
                    className="cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-50"
                  >
                    <UserCheck className="h-4 w-4 mr-2" /> Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [attendanceMap]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <span className="text-sm text-muted-foreground">
            {filtered.length} of {initialEmployees.length}
          </span>
        </div>

        <Link href="/employees/new">
          <Button className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          filterColumn="name"
          searchPlaceholder="Search by name..."
          loading={isPending}
        />
      </div>
    </div>
  );
}
