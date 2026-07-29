"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  User, Search, X, Plus, Package, Loader2, ChevronRight,
  Users, Scissors, ShoppingBag, DollarSign, Check, Ruler, Edit, Info,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createOrderAction } from "@/app/actions/orders";
import { addCustomerAction, updateMeasurementsAction } from "@/app/actions/customers";
import { convertToOrderAction } from "@/app/actions/inquiries";
import MeasurementsForm from "@/components/customers/MeasurementsForm";

const UNASSIGNED = "__unassigned";

interface SelectedMaterial {
  material_id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  quantity_used: number;
  cost: number;
  stock_quantity: number;
}

interface FormData {
  customer_id: string;
  new_customer_name: string;
  new_customer_phone: string;
  new_customer_email: string;
  order_type: "custom" | "product";
  garment_type_id: string;
  product_id: string;
  assigned_tailor_id: string;
  due_date: string;
  description: string;
  notes: string;
  labour_cost: string;
  total_cost: string;
  deposit: string;
}

interface Props {
  customers: any[];
  employees: any[];
  products: any[];
  garmentTypes: any[];
  materials: any[];
  financialSettings: any;
  perOrderOverhead: number;
  prefill?: any;
  inquiryId?: string;
}

const STEPS = [
  { id: 1, label: "Customer", icon: User },
  { id: 2, label: "Garment", icon: Scissors },
  { id: 3, label: "Materials", icon: Package },
  { id: 4, label: "Pricing", icon: DollarSign },
];

export default function CreateOrderForm({
  customers,
  employees,
  products,
  garmentTypes,
  materials,
  financialSettings,
  perOrderOverhead,
  prefill,
  inquiryId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);

  // New customer inline
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [locallyCreatedCustomers, setLocallyCreatedCustomers] = useState<any[]>([]);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");

  // Measurements snapshot (Materials step)
  const [measurementsOverride, setMeasurementsOverride] = useState<Record<string, any>>({});
  const [showMeasurementsDialog, setShowMeasurementsDialog] = useState(false);

  // Materials
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  const { register, control, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      customer_id: prefill?.customer_id ?? "",
      new_customer_name: prefill?.customer_name ?? "",
      new_customer_phone: prefill?.customer_phone ?? "",
      new_customer_email: prefill?.customer_email ?? "",
      order_type: "custom",
      garment_type_id: "",
      product_id: prefill?.product_id ?? "",
      assigned_tailor_id: UNASSIGNED,
      due_date: "",
      description: prefill?.special_requests ?? "",
      notes: "",
      labour_cost: "",
      total_cost: "",
      deposit: "",
    },
  });

  const orderType = watch("order_type");
  const watchedGarmentTypeId = watch("garment_type_id");
  const watchedLabourCost = watch("labour_cost");
  const watchedTotalCost = watch("total_cost");
  const watchedDeposit = watch("deposit");

  // Pre-select product type if prefill has a product
  useEffect(() => {
    if (prefill?.product_id) setValue("order_type", "product");
    if (prefill?.customer_id) setCreatedCustomerId(prefill.customer_id);
  }, [prefill, setValue]);

  // --- Cost calculations ---
  const materialCost = selectedMaterials.reduce((s, m) => s + m.cost, 0);
  const selectedGarmentType = garmentTypes.find((g: any) => g.id === watchedGarmentTypeId);
  const calculatedLabourCost = selectedGarmentType
    ? parseFloat(selectedGarmentType.base_labour_cost || "0")
    : (financialSettings?.custom_hourly_rate || 0) * 2;
  const labourCost = watchedLabourCost !== "" && watchedLabourCost != null
    ? parseFloat(watchedLabourCost || "0")
    : calculatedLabourCost;
  const baseCost = materialCost + labourCost + perOrderOverhead;
  const margin = financialSettings?.default_profit_margin || 30;
  const recommendedPrice = parseFloat((baseCost * (1 + margin / 100)).toFixed(2));
  const totalCost = parseFloat(watchedTotalCost || "0");
  const deposit = parseFloat(watchedDeposit || "0");
  const balance = totalCost - deposit;

  // Seed the editable labour cost field whenever the underlying calculation changes
  // (garment type / order type switch) — does not run on manual edits.
  useEffect(() => {
    setValue("labour_cost", calculatedLabourCost.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedGarmentTypeId, orderType]);

  // --- Material search ---
  const filteredMaterials = materialSearch.length >= 1
    ? materials.filter(
        (m: any) =>
          m.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
          !selectedMaterials.find((s) => s.material_id === m.id)
      ).slice(0, 8)
    : [];

  const handleAddMaterial = (m: any) => {
    setSelectedMaterials((prev) => [
      ...prev,
      {
        material_id: m.id,
        name: m.name,
        unit: m.unit,
        cost_per_unit: parseFloat(m.cost_per_unit || "0"),
        quantity_used: 1,
        cost: parseFloat(m.cost_per_unit || "0"),
        stock_quantity: m.stock_quantity,
      },
    ]);
    setMaterialSearch("");
    setShowMaterialDropdown(false);
  };

  const handleMaterialQtyChange = (id: string, qty: number) => {
    setSelectedMaterials((prev) =>
      prev.map((m) =>
        m.material_id === id
          ? { ...m, quantity_used: qty, cost: parseFloat((m.cost_per_unit * qty).toFixed(2)) }
          : m
      )
    );
  };

  const handleRemoveMaterial = (id: string) => {
    setSelectedMaterials((prev) => prev.filter((m) => m.material_id !== id));
  };

  // --- Customer search filter ---
  const allCustomers = [...customers, ...locallyCreatedCustomers];
  const filteredCustomers = customerSearch
    ? customers.filter(
        (c: any) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          (c.phone && c.phone.includes(customerSearch))
      )
    : customers;

  // --- Selected customer + measurements snapshot ---
  const selectedCustomerId = watch("customer_id") || createdCustomerId;
  const selectedCustomer = allCustomers.find((c: any) => c.id === selectedCustomerId) || null;
  const effectiveMeasurements = selectedCustomerId
    ? measurementsOverride[selectedCustomerId] ?? selectedCustomer?.measurements ?? null
    : null;

  const handleSaveMeasurements = (measurements: any) => {
    if (!selectedCustomerId) return;
    updateMeasurementsAction(selectedCustomerId, measurements).then((result) => {
      if (result.success) {
        setMeasurementsOverride((prev) => ({ ...prev, [selectedCustomerId]: measurements }));
        toast.success("Measurements saved");
        setShowMeasurementsDialog(false);
      } else {
        toast.error(result.message || "Failed to save measurements");
      }
    });
  };

  // --- Save new customer ---
  const handleSaveNewCustomer = async () => {
    const name = getValues("new_customer_name").trim();
    const phone = getValues("new_customer_phone").trim();
    if (!name) { toast.error("Customer name is required"); return; }
    setSavingCustomer(true);
    const email = getValues("new_customer_email").trim();
    const result = await addCustomerAction({ name, phone, email });
    if (result.success && result.customerId) {
      setCreatedCustomerId(result.customerId);
      setValue("customer_id", result.customerId);
      setLocallyCreatedCustomers((prev) => [
        ...prev,
        { id: result.customerId, name, phone, email, measurements: null },
      ]);
      setIsNewCustomer(false);
      toast.success(`Customer "${name}" added`);
    } else {
      toast.error(result.message || "Failed to create customer");
    }
    setSavingCustomer(false);
  };

  // --- Step validation ---
  const canAdvanceStep1 = () => {
    const cid = getValues("customer_id") || createdCustomerId;
    return !!cid;
  };

  const canAdvanceStep2 = () => {
    if (orderType === "custom") return !!watchedGarmentTypeId;
    return !!getValues("product_id");
  };

  // --- Submit ---
  const handleSubmit = () => {
    const values = getValues();
    const customerId = values.customer_id || createdCustomerId;
    if (!customerId) { toast.error("Please select a customer"); setStep(1); return; }
    if (!values.total_cost || parseFloat(values.total_cost) <= 0) {
      toast.error("Please enter a selling price"); return;
    }

    startTransition(async () => {
      const orderData = {
        customer_id: customerId,
        garment_type_id: orderType === "custom" ? values.garment_type_id || null : null,
        product_id: orderType === "product" ? values.product_id || null : null,
        assigned_tailor_id: values.assigned_tailor_id === UNASSIGNED ? null : values.assigned_tailor_id || null,
        due_date: values.due_date || null,
        total_cost: parseFloat(values.total_cost),
        labour_cost: parseFloat(values.labour_cost || "0"),
        material_cost: materialCost,
        deposit: parseFloat(values.deposit || "0"),
        description: values.description,
        notes: values.notes,
        status: "enquiry",
        materials: selectedMaterials.map((m) => ({
          material_id: m.material_id,
          quantity_used: m.quantity_used,
          cost: m.cost,
        })),
      };

      let result: any;
      if (inquiryId) {
        result = await convertToOrderAction(inquiryId, orderData);
      } else {
        result = await createOrderAction(orderData);
      }

      if (result.success) {
        toast.success(inquiryId ? "Inquiry converted to order" : "Order created successfully");
        router.push(`/orders/${result.orderId}`);
      } else {
        toast.error(result.message || "Failed to create order");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isDone && setStep(s.id)}
                disabled={!isDone}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive && "bg-primary/10 text-primary",
                  isDone && "text-muted-foreground hover:text-foreground cursor-pointer",
                  !isActive && !isDone && "text-muted-foreground/40 cursor-default"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isActive && "bg-primary text-primary-foreground",
                    isDone && "bg-primary/20 text-primary",
                    !isActive && !isDone && "bg-muted text-muted-foreground/40"
                  )}
                >
                  {isDone ? <Check size={12} /> : s.id}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-muted-foreground/30 shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step panels */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">

        {/* STEP 1: Customer */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Users size={16} className="text-primary" /> Customer
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Search an existing customer or add a new one</p>
            </div>

            {!isNewCustomer ? (
              <div className="space-y-3">
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
                <div className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-3 py-4 text-center">No customers found</p>
                  ) : (
                    filteredCustomers.map((c: any) => {
                      const selected = watch("customer_id") === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setValue("customer_id", c.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors",
                            selected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {c.name[0].toUpperCase()}
                          </div>
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
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(true)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Plus size={12} /> Add new customer
                </button>
              </div>
            ) : (
              <div className="space-y-3 border border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                <p className="text-xs font-semibold text-primary">New Customer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="new_name" className="text-xs">Full Name *</Label>
                    <Input id="new_name" {...register("new_customer_name")} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="new_phone" className="text-xs">Phone</Label>
                    <Input id="new_phone" {...register("new_customer_phone")} className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="new_email" className="text-xs">Email</Label>
                    <Input id="new_email" type="email" {...register("new_customer_email")} className="mt-1 h-8 text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveNewCustomer}
                    loading={savingCustomer}
                    className="h-7 text-xs"
                  >
                    Save Customer
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNewCustomer(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {(watch("customer_id") || createdCustomerId) && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Check size={12} /> Customer selected
              </p>
            )}
          </div>
        )}

        {/* STEP 2: Garment */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Scissors size={16} className="text-primary" /> Garment Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Choose what you're making and who's making it</p>
            </div>

            {/* Order type toggle */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Order Type</Label>
              <div className="flex gap-2 mt-1.5">
                {(["custom", "product"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("order_type", type)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                      orderType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {type === "custom" ? <Scissors size={14} /> : <ShoppingBag size={14} />}
                    {type === "custom" ? "Custom Design" : "From Product"}
                  </button>
                ))}
              </div>
            </div>

            {orderType === "custom" ? (
              <div>
                <Label htmlFor="garment_type_id">Garment Type *</Label>
                <Controller
                  name="garment_type_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="garment_type_id" className="mt-1 w-full h-9">
                        <SelectValue placeholder="Select garment type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {garmentTypes.map((g: any) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} — K{parseFloat(g.base_labour_cost || "0").toFixed(0)} labour
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="product_id">Product *</Label>
                <Controller
                  name="product_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="product_id" className="mt-1 w-full h-9">
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — K{parseFloat(p.base_price || "0").toFixed(0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_tailor_id">Assigned Tailor</Label>
                <Controller
                  name="assigned_tailor_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="assigned_tailor_id" className="mt-1 w-full h-9">
                        <SelectValue placeholder="Not assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Not assigned</SelectItem>
                        {employees.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input id="due_date" type="date" {...register("due_date")} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Special Requests / Description</Label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                placeholder="Describe the garment, style preferences, measurements notes..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <textarea
                id="notes"
                {...register("notes")}
                rows={2}
                placeholder="Notes visible to staff only..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Materials */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Package size={16} className="text-primary" /> Materials
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add materials needed for this order. Leave empty for product-based orders.
              </p>
            </div>

            {/* Customer measurements snapshot */}
            {selectedCustomer && (
              <div className="border border-border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Ruler size={14} className="text-primary" />
                    <span className="text-xs font-semibold">
                      {selectedCustomer.name}&apos;s Measurements
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMeasurementsDialog(true)}
                    className="h-7 text-xs gap-1"
                  >
                    {effectiveMeasurements ? <Edit size={12} /> : <Plus size={12} />}
                    {effectiveMeasurements ? "Edit" : "Add Measurements"}
                  </Button>
                </div>
                {effectiveMeasurements ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Object.entries(effectiveMeasurements)
                      .filter(([key, value]) => key !== "notes" && value !== undefined && value !== "")
                      .map(([key, value]) => (
                        <div key={key} className="rounded-md border border-border/60 bg-card px-2 py-1.5">
                          <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wide truncate">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {value as React.ReactNode}
                            <span className="text-[9px] ml-0.5 text-muted-foreground">in</span>
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No measurements on file yet.</p>
                )}
              </div>
            )}

            {/* Material search */}
            <div className="relative">
              <div className="flex items-center border border-input rounded-md bg-background px-3 gap-2 h-9">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search materials to add..."
                  value={materialSearch}
                  onChange={(e) => {
                    setMaterialSearch(e.target.value);
                    setShowMaterialDropdown(e.target.value.length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowMaterialDropdown(false), 150)}
                  className="flex-1 text-sm bg-transparent outline-none"
                />
                {materialSearch && (
                  <button type="button" onClick={() => { setMaterialSearch(""); setShowMaterialDropdown(false); }}>
                    <X size={13} className="text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {showMaterialDropdown && filteredMaterials.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                  {filteredMaterials.map((m: any) => (
                    <button
                      key={m.id}
                      type="button"
                      onMouseDown={() => handleAddMaterial(m)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-muted/50 flex justify-between items-center gap-2"
                    >
                      <span className="font-medium">{m.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <span>K{parseFloat(m.cost_per_unit || "0").toFixed(2)}/{m.unit}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full font-medium",
                          m.stock_quantity > 5 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {m.stock_quantity} {m.unit}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected materials */}
            {selectedMaterials.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 border-b border-border grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="col-span-5">Material</span>
                  <span className="col-span-3 text-center">Quantity</span>
                  <span className="col-span-3 text-right">Cost</span>
                  <span className="col-span-1" />
                </div>
                {selectedMaterials.map((m) => (
                  <div key={m.material_id} className="px-3 py-2.5 border-b border-border last:border-0 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <p className="text-sm font-medium">{m.name}</p>
                    </div>
                    <div className="col-span-3 flex items-center gap-1 justify-center">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={m.quantity_used}
                        onChange={(e) => handleMaterialQtyChange(m.material_id, parseFloat(e.target.value) || 0)}
                        className="w-16 h-7 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">{m.unit}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-sm font-semibold text-primary">K{m.cost.toFixed(2)}</span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(m.material_id)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="bg-muted/20 px-3 py-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Materials Total</span>
                  <span className="text-sm font-bold text-primary">K{materialCost.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg py-8 text-center text-muted-foreground text-sm">
                <Package size={24} className="mx-auto mb-2 opacity-30" />
                No materials added yet
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Pricing */}
        {step === 4 && (
          <TooltipProvider delayDuration={150}>
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <DollarSign size={16} className="text-primary" /> Pricing & Review
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review the full cost breakdown, adjust labour if needed, and confirm the selling price
                </p>
              </div>

              {/* Cost breakdown */}
              <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Material Cost
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Sum of all materials added in the Materials step, at current cost per unit.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span>K{materialCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Labour Cost {selectedGarmentType ? `(${selectedGarmentType.name})` : ""}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Tailor&apos;s time for this garment type — calculated automatically from
                        Settings, but you can edit it below for this order.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register("labour_cost")}
                      className="h-7 w-24 text-right text-sm"
                    />
                    {Math.abs(labourCost - calculatedLabourCost) > 0.005 && (
                      <button
                        type="button"
                        onClick={() => setValue("labour_cost", calculatedLabourCost.toFixed(2))}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline shrink-0"
                      >
                        Reset
                      </button>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Overhead / Order
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        This order&apos;s share of monthly business expenses, set in Settings &gt; Financial.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span>K{perOrderOverhead.toFixed(2)}</span>
                </div>

                <div className="border-t border-border my-1" />

                <div className="flex justify-between items-center font-medium">
                  <span className="flex items-center gap-1.5">
                    Base Cost
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Materials + Labour + Overhead — the break-even point with no profit.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span>K{baseCost.toFixed(2)}</span>
                </div>

                {recommendedPrice > 0 && (
                  <div className="flex justify-between items-center font-semibold text-primary">
                    <span className="flex items-center gap-1.5">
                      Recommended ({margin}% margin)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={12} className="cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Base Cost marked up by your default profit margin, set in Settings &gt; Financial.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <div className="flex items-center gap-2">
                      <span>K{recommendedPrice.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setValue("total_cost", recommendedPrice.toFixed(2))}
                        className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 font-medium"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_cost" className="flex items-center gap-1.5">
                    Selling Price (K) *
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        What the customer is actually charged. Defaults to nothing — use the
                        &quot;Use&quot; button above or enter your own price.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="total_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register("total_cost")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit" className="flex items-center gap-1.5">
                    Deposit (K)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Amount collected upfront. The rest shows as Balance Due below.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register("deposit")}
                    className="mt-1"
                  />
                </div>
              </div>

              {totalCost > 0 && (
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    Balance Due
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Selling Price minus Deposit — what&apos;s still owed on completion.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className={cn("font-bold text-base", balance < 0 ? "text-destructive" : "text-primary")}>
                    K{balance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </TooltipProvider>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => step === 1 ? router.back() : setStep((s) => s - 1)}
        >
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        <div className="flex items-center gap-2">
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => {
                if (step === 1 && !canAdvanceStep1()) {
                  toast.error("Please select a customer first");
                  return;
                }
                if (step === 2 && !canAdvanceStep2()) {
                  toast.error(`Please select a ${orderType === "custom" ? "garment type" : "product"}`);
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              Continue <ChevronRight size={15} className="ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              loading={isPending}
            >
              {isPending ? "Creating..." : inquiryId ? "Convert to Order" : "Create Order"}
            </Button>
          )}
        </div>
      </div>

      {/* Measurements Dialog */}
      <Dialog open={showMeasurementsDialog} onOpenChange={setShowMeasurementsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {effectiveMeasurements ? "Update Measurements" : "Add Measurements"}
              {selectedCustomer ? ` — ${selectedCustomer.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <MeasurementsForm
              customer={{ ...selectedCustomer, measurements: effectiveMeasurements }}
              onSubmit={handleSaveMeasurements}
              onCancel={() => setShowMeasurementsDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
