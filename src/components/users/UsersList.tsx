"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import {
  UserCheck, UserX, ChevronDown, Plus, Shield, UserCog,
  Users, Eye, EyeOff, Lock, Mail, User, Copy, Check, CheckCircle2, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateUserRole, toggleUserActive, createUserAction } from "@/app/actions/users";
import { ROLE_BADGE_COLORS } from "@/lib/constants";

const ROLES = ["admin", "manager", "employee"] as const;

// ─── Create User Dialog ─────────────────────────────────────────────────────
function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successData, setSuccessData] = useState<{ email: string; password: string; fullName: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", role: "employee" },
  });
  const role = watch("role");

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const result = await createUserAction({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      if (result.success) {
        setSuccessData({ fullName: data.fullName, email: data.email, password: data.password });
        reset();
        onCreated();
      } else {
        toast.error(result.message || "Failed to create user");
      }
    });
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${successData!.email}\nPassword: ${successData!.password}`);
    setCopied(true);
    toast.success("Credentials copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setSuccessData(null);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* @ts-ignore */}
        <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new ERP login account.</DialogDescription>
        </DialogHeader>

        {successData ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center gap-3 p-6 bg-green-50 rounded-xl border border-green-100">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Account created!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Share these credentials securely with <strong>{successData.fullName}</strong>.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1 text-sm font-mono">
              <p className="text-amber-800">Email: {successData.email}</p>
              <p className="text-amber-800">Password: {successData.password}</p>
            </div>
            <DialogFooter className="gap-2">
              {/* @ts-ignore */}
              <Button variant="outline" onClick={copyCredentials} className="flex-1">
                {copied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Credentials</>}
              </Button>
              {/* @ts-ignore */}
              <Button onClick={handleClose} className="flex-1">Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" placeholder="Jane Doe" className="pl-9"
                  {...register("fullName", { required: "Required", minLength: { value: 2, message: "Too short" } })} />
              </div>
              {errors.fullName && <p className="text-xs text-destructive">{String(errors.fullName.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="jane@example.com" className="pl-9"
                  {...register("email", { required: "Required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{String(errors.email.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" className="pl-9 pr-10"
                  {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 characters" } })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{String(errors.password.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="confirmPassword" type="password" placeholder="Repeat password" className="pl-9"
                  {...register("confirmPassword", {
                    required: "Required",
                    validate: (v) => v === watch("password") || "Passwords do not match",
                  })} />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{String(errors.confirmPassword.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setValue("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">
                    <div><p className="font-medium">Employee</p><p className="text-xs text-muted-foreground">Basic access to assigned tasks</p></div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div><p className="font-medium">Manager</p><p className="text-xs text-muted-foreground">Manage orders and inventory</p></div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div><p className="font-medium">Administrator</p><p className="text-xs text-muted-foreground">Full system access</p></div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              {/* @ts-ignore */}
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
              {/* @ts-ignore */}
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main List ───────────────────────────────────────────────────────────────
interface UsersListProps {
  initialUsers: any[];
}

export default function UsersList({ initialUsers }: UsersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "manager" | "employee">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const stats = useMemo(() => ({
    total: initialUsers.length,
    admins: initialUsers.filter((u) => u.role === "admin").length,
    managers: initialUsers.filter((u) => u.role === "manager").length,
    employees: initialUsers.filter((u) => u.role === "employee").length,
    active: initialUsers.filter((u) => u.active).length,
  }), [initialUsers]);

  const filtered = useMemo(() => {
    return initialUsers.filter((u) => {
      if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) &&
          !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.active) return false;
      if (statusFilter === "inactive" && u.active) return false;
      return true;
    });
  }, [initialUsers, search, roleFilter, statusFilter]);

  const handleRoleChange = (id: string, newRole: "admin" | "manager" | "employee") => {
    startTransition(async () => {
      const result = await updateUserRole(id, newRole);
      if (result.success) { toast.success("Role updated"); router.refresh(); }
      else toast.error(result.message || "Failed to update role");
    });
  };

  const handleToggleActive = (id: string, currentActive: boolean, name: string) => {
    const action = currentActive ? "deactivate" : "activate";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${name}?`)) return;
    startTransition(async () => {
      const result = await toggleUserActive(id, !currentActive);
      if (result.success) { toast.success(`User ${action}d`); router.refresh(); }
      else toast.error(result.message || `Failed to ${action}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "text-red-600 bg-red-50 border-red-100" },
          { label: "Managers", value: stats.managers, icon: UserCog, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Employees", value: stats.employees, icon: Users, color: "text-green-600 bg-green-50 border-green-100" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-primary bg-primary/5 border-primary/20" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[220px] h-9"
            />
          </div>

          {/* Role filter */}
          <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}>
                {s}
              </button>
            ))}
          </div>

          <span className="text-sm text-muted-foreground">{filtered.length} of {initialUsers.length}</span>
        </div>

        <CreateUserDialog onCreated={() => router.refresh()} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No users match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Member Since</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user: any) => {
                  const initials = user.full_name
                    ? String(user.full_name).split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "??";
                  return (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{user.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("capitalize shadow-sm", ROLE_BADGE_COLORS[user.role] || "bg-muted text-muted-foreground")}>
                          {user.role || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={user.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"}>
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {user.created_at ? format(new Date(user.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              {/* @ts-ignore */}
                              <Button variant="outline" size="sm" disabled={isPending} className="h-8 text-xs gap-1">
                                Change Role <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>Assign Role</DropdownMenuLabel>
                              {ROLES.map((role) => (
                                <DropdownMenuItem key={role} onClick={() => handleRoleChange(user.id, role)}
                                  disabled={user.role === role}
                                  className={cn("cursor-pointer capitalize", user.role === role && "font-semibold")}>
                                  {role}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* @ts-ignore */}
                          <Button variant="ghost" size="sm" disabled={isPending}
                            onClick={() => handleToggleActive(user.id, user.active, user.full_name)}
                            className={cn("h-8 w-8 p-0", user.active ? "text-destructive hover:bg-destructive/10" : "text-emerald-600 hover:bg-emerald-50")}
                            title={user.active ? "Deactivate" : "Activate"}>
                            {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
