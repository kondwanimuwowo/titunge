"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalyticsFilters } from "@/lib/data/analytics";

const ALL = "__all";

const STATUS_OPTIONS = [
  "enquiry", "contacted", "measurements", "production",
  "fitting", "completed", "delivered", "cancelled",
];

interface AdvancedFiltersProps {
  customers: any[];
  employees: any[];
  loading?: boolean;
  onApply: (filters: AnalyticsFilters) => void;
}

export function AdvancedFilters({ customers, employees, loading, onApply }: AdvancedFiltersProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerId, setCustomerId] = useState(ALL);
  const [employeeId, setEmployeeId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const buildFilters = (): AnalyticsFilters => ({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    customerId: customerId !== ALL ? customerId : undefined,
    employeeId: employeeId !== ALL ? employeeId : undefined,
    status: status !== ALL ? status : undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
  });

  const handleApply = () => onApply(buildFilters());

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setCustomerId(ALL);
    setEmployeeId(ALL);
    setStatus(ALL);
    setMinAmount("");
    setMaxAmount("");
    onApply({});
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Customers</SelectItem>
              {customers.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Employee</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Employees</SelectItem>
              {employees.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Min K</Label>
            <Input type="number" min="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Max K</Label>
            <Input type="number" min="0" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleApply} loading={loading} className="h-8 text-xs">
          Apply Filters
        </Button>
        <Button size="sm" variant="ghost" onClick={handleClear} className="h-8 text-xs gap-1">
          <X size={12} /> Clear
        </Button>
      </div>
    </div>
  );
}
