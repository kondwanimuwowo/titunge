"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  User, Search, X, Plus, ChevronRight,
  Users, Scissors, ShoppingBag, DollarSign, Check, Ruler, Edit, Info, Trash2, ShoppingCart,
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
import type { OrderItemInput } from "@/lib/orderItems";

const UNASSIGNED = "__unassigned";

interface SelectedMaterial {
  material_id: string;
  name: string;
  unit: string;
  unit_cost: number;
  quantity_used: number;
  cost: number;
}

/** One item sitting in the basket, with enough display info to render the
 *  row — OrderItemInput alone doesn't carry names/labels. */
interface BasketItem extends OrderItemInput {
  key: string;
  displayName: string;
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
  { id: 2, label: "Items", icon: ShoppingCart },
  { id: 3, label: "Review", icon: DollarSign },
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

  // --- Customer (identical to before) ---
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [locallyCreatedCustomers, setLocallyCreatedCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [measurementsOverride, setMeasurementsOverride] = useState<Record<string, any>>({});
  const [showMeasurementsDialog, setShowMeasurementsDialog] = useState(false);

  // --- Basket ---
  const [basket, setBasket] = useState<BasketItem[]>([]);

  // --- Item builder (the form for the item currently being configured) ---
  const [itemType, setItemType] = useState<"custom" | "ready_made">("custom");
  const [builderGarmentTypeId, setBuilderGarmentTypeId] = useState("");
  const [builderProductId, setBuilderProductId] = useState("");
  const [builderQty, setBuilderQty] = useState(1);
  const [builderUnitPrice, setBuilderUnitPrice] = useState("");
  const [builderLabourCost, setBuilderLabourCost] = useState("");
  const [builderStyleNotes, setBuilderStyleNotes] = useState("");
  const [builderMaterials, setBuilderMaterials] = useState<SelectedMaterial[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  const { register, control, watch, setValue, getValues } = useForm({
    defaultValues: {
      customer_id: prefill?.customer_id ?? "",
      new_customer_name: prefill?.customer_name ?? "",
      new_customer_phone: prefill?.customer_phone ?? "",
      new_customer_email: prefill?.customer_email ?? "",
      assigned_tailor_id: UNASSIGNED,
      due_date: "",
      description: prefill?.special_requests ?? "",
      notes: "",
      deposit: "",
    },
  });

  useEffect(() => {
    if (prefill?.customer_id) setCreatedCustomerId(prefill.customer_id);
  }, [prefill]);

  // --- Builder cost calculations ---
  const builderMaterialCost = builderMaterials.reduce((s, m) => s + m.cost, 0);
  const selectedGarmentType = garmentTypes.find((g: any) => g.id === builderGarmentTypeId);
  const selectedProduct = products.find((p: any) => p.id === builderProductId);
  const defaultLabourHours = parseFloat(String(financialSettings?.default_labour_hours ?? 2));
  const calculatedLabourCost = selectedGarmentType
    ? parseFloat(selectedGarmentType.base_labour_cost || "0")
    : (financialSettings?.custom_hourly_rate || 0) * defaultLabourHours;
  const labourCost = itemType === "custom"
    ? (builderLabourCost !== "" ? parseFloat(builderLabourCost || "0") : calculatedLabourCost)
    : 0;
  const margin = financialSettings?.default_profit_margin || 30;
  const recommendedUnitPrice = itemType === "custom"
    ? parseFloat(((builderMaterialCost + labourCost) * (1 + margin / 100)).toFixed(2))
    : parseFloat(selectedProduct?.price || "0");

  // Seed labour cost whenever the garment type changes
  useEffect(() => {
    setBuilderLabourCost(calculatedLabourCost.toFixed(2));
  }, [builderGarmentTypeId, calculatedLabourCost]);

  // Seed unit price with the recommendation whenever its inputs change, unless
  // the user already typed something different for this item.
  useEffect(() => {
    setBuilderUnitPrice(recommendedUnitPrice > 0 ? recommendedUnitPrice.toFixed(2) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderGarmentTypeId, builderProductId, itemType]);

  const resetBuilder = () => {
    setItemType("custom");
    setBuilderGarmentTypeId("");
    setBuilderProductId("");
    setBuilderQty(1);
    setBuilderUnitPrice("");
    setBuilderLabourCost("");
    setBuilderStyleNotes("");
    setBuilderMaterials([]);
    setMaterialSearch("");
  };

  const filteredMaterials = materials
    .filter(
      (m: any) =>
        m.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
        !builderMaterials.find((s) => s.material_id === m.id)
    )
    .slice(0, 8);

  const handleAddMaterial = (m: any) => {
    setBuilderMaterials((prev) => [
      ...prev,
      {
        material_id: m.id,
        name: m.name,
        unit: m.unit,
        unit_cost: parseFloat(m.unit_cost || "0"),
        quantity_used: 1,
        cost: parseFloat(m.unit_cost || "0"),
        stock_quantity: m.stock_quantity,
      } as SelectedMaterial,
    ]);
    setMaterialSearch("");
    setShowMaterialDropdown(false);
  };

  const handleMaterialQtyChange = (id: string, qty: number) => {
    setBuilderMaterials((prev) =>
      prev.map((m) =>
        m.material_id === id
          ? { ...m, quantity_used: qty, cost: parseFloat((m.unit_cost * qty).toFixed(2)) }
          : m
      )
    );
  };

  const handleRemoveMaterial = (id: string) => {
    setBuilderMaterials((prev) => prev.filter((m) => m.material_id !== id));
  };

  const canAddItem = itemType === "custom"
    ? !!builderGarmentTypeId && parseFloat(builderUnitPrice || "0") > 0
    : !!builderProductId && parseFloat(builderUnitPrice || "0") > 0;

  const handleAddItemToBasket = () => {
    if (!canAddItem) {
      toast.error(itemType === "custom" ? "Select a garment type and a price" : "Select a product and a price");
      return;
    }

    const newItem: BasketItem = {
      key: `${Date.now()}-${Math.random()}`,
      item_type: itemType,
      product_id: itemType === "ready_made" ? builderProductId : null,
      garment_type_id: itemType === "custom" ? builderGarmentTypeId : null,
      description: itemType === "custom" ? selectedGarmentType?.name || null : selectedProduct?.name || null,
      quantity: builderQty || 1,
      unit_price: parseFloat(builderUnitPrice || "0"),
      material_cost: itemType === "custom" ? builderMaterialCost : 0,
      labour_cost: itemType === "custom" ? labourCost : 0,
      style_notes: builderStyleNotes || null,
      materials: itemType === "custom"
        ? builderMaterials.map((m) => ({ material_id: m.material_id, quantity_used: m.quantity_used, unit_cost: m.unit_cost }))
        : [],
      displayName: itemType === "custom" ? (selectedGarmentType?.name || "Custom item") : (selectedProduct?.name || "Product"),
    };

    setBasket((prev) => [...prev, newItem]);
    resetBuilder();
    toast.success("Item added");
  };

  const handleRemoveBasketItem = (key: string) => {
    setBasket((prev) => prev.filter((i) => i.key !== key));
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

  const canAdvanceStep1 = () => {
    const cid = getValues("customer_id") || createdCustomerId;
    return !!cid;
  };

  // --- Order totals ---
  const orderSubtotal = basket.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const orderMaterialCost = basket.reduce((s, it) => s + it.material_cost, 0);
  const orderLabourCost = basket.reduce((s, it) => s + it.labour_cost, 0);
  const watchedDeposit = watch("deposit");
  const deposit = parseFloat(watchedDeposit || "0");
  const balance = orderSubtotal - deposit;

  const handleSubmit = () => {
    const values = getValues();
    const customerId = values.customer_id || createdCustomerId;
    if (!customerId) { toast.error("Please select a customer"); setStep(1); return; }
    if (basket.length === 0) { toast.error("Add at least one item"); setStep(2); return; }

    startTransition(async () => {
      const orderData = {
        customer_id: customerId,
        assigned_tailor_id: values.assigned_tailor_id === UNASSIGNED ? null : values.assigned_tailor_id || null,
        due_date: values.due_date || null,
        deposit: deposit || 0,
        description: values.description,
        notes: values.notes,
        status: "enquiry",
        items: basket.map((item) => ({
          item_type: item.item_type,
          product_id: item.product_id,
          garment_type_id: item.garment_type_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          material_cost: item.material_cost,
          labour_cost: item.labour_cost,
          style_notes: item.style_notes,
          materials: item.materials,
        })),
      };

      const result = inquiryId
        ? await convertToOrderAction(inquiryId, orderData)
        : await createOrderAction(orderData);

      if (result.success) {
        toast.success(inquiryId ? "Inquiry converted to order" : "Order created successfully");
        if (result.warning) toast.error(result.warning);
        router.push(`/orders/${result.orderId}`);
      } else {
        toast.error(result.message || "Failed to create order");
      }
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
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
                {s.id === 2 && basket.length > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5">{basket.length}</span>
                )}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-muted-foreground/30 shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step panels */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-md">

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
                  <Button type="button" size="sm" onClick={handleSaveNewCustomer} loading={savingCustomer} className="h-7 text-xs">
                    Save Customer
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewCustomer(false)} className="h-7 text-xs">
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

        {/* STEP 2: Items */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary" /> Items
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add each garment or product to this order one at a time — ready-made items pull straight from
                stock, custom ones go through measurements and materials.
              </p>
            </div>

            {/* Customer measurements snapshot */}
            {selectedCustomer && (
              <div className="border border-border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Ruler size={14} className="text-primary" />
                    <span className="text-xs font-semibold">{selectedCustomer.name}&apos;s Measurements</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowMeasurementsDialog(true)} className="h-7 text-xs gap-1">
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
                          <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wide truncate">{key.replace(/_/g, " ")}</p>
                          <p className="text-sm font-bold text-foreground">{value as React.ReactNode}<span className="text-[9px] ml-0.5 text-muted-foreground">in</span></p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No measurements on file yet.</p>
                )}
              </div>
            )}

            {/* Item builder */}
            <div className="border border-dashed border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
              <div className="flex gap-2">
                {(["custom", "ready_made"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setItemType(type)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                      itemType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 bg-card"
                    )}
                  >
                    {type === "custom" ? <Scissors size={14} /> : <ShoppingBag size={14} />}
                    {type === "custom" ? "Custom Design" : "Ready-made Product"}
                  </button>
                ))}
              </div>

              {itemType === "custom" ? (
                <>
                  <div>
                    <Label>Garment Type *</Label>
                    <Select value={builderGarmentTypeId} onValueChange={setBuilderGarmentTypeId}>
                      <SelectTrigger className="mt-1 w-full h-9 bg-card">
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
                  </div>

                  {/* Materials */}
                  <div className="relative">
                    <Label className="text-xs">Materials</Label>
                    <div className="flex items-center border border-input rounded-md bg-card px-3 gap-2 h-9 mt-1">
                      <Search size={14} className="text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        placeholder="Search or browse materials to add..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        onFocus={() => setShowMaterialDropdown(true)}
                        onBlur={() => setTimeout(() => setShowMaterialDropdown(false), 150)}
                        className="flex-1 text-sm bg-transparent outline-none"
                      />
                      {materialSearch && (
                        <button type="button" onClick={() => setMaterialSearch("")}>
                          <X size={13} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                    {showMaterialDropdown && filteredMaterials.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                        {filteredMaterials.map((m: any) => (
                          <button key={m.id} type="button" onMouseDown={() => handleAddMaterial(m)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-muted/50 flex justify-between items-center gap-2">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">K{parseFloat(m.unit_cost || "0").toFixed(2)}/{m.unit}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {builderMaterials.length > 0 && (
                      <div className="border border-border rounded-lg overflow-hidden mt-2 bg-card">
                        {builderMaterials.map((m) => (
                          <div key={m.material_id} className="px-3 py-2 border-b border-border last:border-0 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5 text-sm font-medium">{m.name}</div>
                            <div className="col-span-4 flex items-center gap-1">
                              <Input type="number" min="0.01" step="0.01" value={m.quantity_used}
                                onChange={(e) => handleMaterialQtyChange(m.material_id, parseFloat(e.target.value) || 0)}
                                className="w-16 h-7 text-xs text-center" />
                              <span className="text-xs text-muted-foreground">{m.unit}</span>
                            </div>
                            <div className="col-span-2 text-right text-sm font-semibold text-primary">K{m.cost.toFixed(2)}</div>
                            <div className="col-span-1 flex justify-end">
                              <button type="button" onClick={() => handleRemoveMaterial(m.material_id)} className="p-1 text-muted-foreground hover:text-destructive rounded">
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        Labour Cost
                        <Tooltip>
                          <TooltipTrigger asChild><Info size={11} className="cursor-help" /></TooltipTrigger>
                          <TooltipContent className="max-w-xs">Auto-calculated from the garment type, editable per item.</TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input type="number" min="0" step="0.01" value={builderLabourCost}
                        onChange={(e) => setBuilderLabourCost(e.target.value)} className="mt-1 h-9 bg-card" />
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" min="1" step="1" value={builderQty}
                        onChange={(e) => setBuilderQty(parseInt(e.target.value, 10) || 1)} className="mt-1 h-9 bg-card" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Style notes for this item</Label>
                    <textarea value={builderStyleNotes} onChange={(e) => setBuilderStyleNotes(e.target.value)} rows={2}
                      placeholder="Style preferences specific to this garment..."
                      className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Product *</Label>
                    <Select value={builderProductId} onValueChange={setBuilderProductId}>
                      <SelectTrigger className="mt-1 w-full h-9 bg-card">
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => {
                          const tracksStock = p.product_type === "finished_good" && p.stock_quantity != null;
                          return (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — K{parseFloat(p.price || "0").toFixed(0)}
                              {tracksStock && (p.stock_quantity <= 0 ? " — out of stock" : ` — ${p.stock_quantity} in stock`)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input type="number" min="1" step="1" value={builderQty}
                      onChange={(e) => setBuilderQty(parseInt(e.target.value, 10) || 1)} className="mt-1 h-9 w-24 bg-card" />
                  </div>
                </>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-xs flex items-center gap-1">
                    Unit Price (K) *
                    {itemType === "custom" && recommendedUnitPrice > 0 && (
                      <button type="button" onClick={() => setBuilderUnitPrice(recommendedUnitPrice.toFixed(2))}
                        className="text-[10px] text-primary hover:underline font-normal">
                        use recommended K{recommendedUnitPrice.toFixed(2)}
                      </button>
                    )}
                  </Label>
                  <Input type="number" min="0" step="0.01" value={builderUnitPrice}
                    onChange={(e) => setBuilderUnitPrice(e.target.value)} className="mt-1 h-9 bg-card" />
                </div>
                <Button type="button" onClick={handleAddItemToBasket} disabled={!canAddItem} className="gap-1.5 h-9">
                  <Plus size={14} /> Add to Order
                </Button>
              </div>
            </div>

            {/* Basket */}
            {basket.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 border-b border-border grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Unit Price</span>
                  <span className="col-span-2 text-right">Line Total</span>
                  <span className="col-span-1" />
                </div>
                {basket.map((item) => (
                  <div key={item.key} className="px-3 py-2.5 border-b border-border last:border-0 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {item.item_type === "custom" ? <Scissors size={12} className="text-muted-foreground" /> : <ShoppingBag size={12} className="text-muted-foreground" />}
                        {item.displayName}
                      </p>
                    </div>
                    <div className="col-span-2 text-center text-sm">{item.quantity}</div>
                    <div className="col-span-2 text-right text-sm">K{item.unit_price.toFixed(2)}</div>
                    <div className="col-span-2 text-right text-sm font-semibold text-primary">K{(item.unit_price * item.quantity).toFixed(2)}</div>
                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={() => handleRemoveBasketItem(item.key)} className="p-1 text-muted-foreground hover:text-destructive rounded">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="bg-muted/20 px-3 py-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Order Total</span>
                  <span className="text-sm font-bold text-primary">K{orderSubtotal.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg py-8 text-center text-muted-foreground text-sm">
                <ShoppingCart size={24} className="mx-auto mb-2 opacity-30" />
                No items added yet
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
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
              <textarea id="description" {...register("description")} rows={2}
                placeholder="Anything about this order as a whole..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>

            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <textarea id="notes" {...register("notes")} rows={2}
                placeholder="Notes visible to staff only..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <DollarSign size={16} className="text-primary" /> Review & Pricing
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Confirm the items, take a deposit if needed, and create the order</p>
              </div>

              <div className="border border-border rounded-lg divide-y divide-border">
                {basket.map((item) => (
                  <div key={item.key} className="px-4 py-2.5 flex justify-between items-center text-sm">
                    <span>{item.displayName} {item.quantity > 1 ? `× ${item.quantity}` : ""}</span>
                    <span className="font-medium">K{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Material Cost
                    <Tooltip>
                      <TooltipTrigger asChild><Info size={12} className="cursor-help" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">Sum of materials across every custom item in this order.</TooltipContent>
                    </Tooltip>
                  </span>
                  <span>K{orderMaterialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Labour Cost
                    <Tooltip>
                      <TooltipTrigger asChild><Info size={12} className="cursor-help" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">Sum of labour across every custom item in this order.</TooltipContent>
                    </Tooltip>
                  </span>
                  <span>K{orderLabourCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Overhead / Order
                    <Tooltip>
                      <TooltipTrigger asChild><Info size={12} className="cursor-help" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">This order&apos;s share of monthly business expenses, set in Settings &gt; Financial. Already folded into each item&apos;s recommended price.</TooltipContent>
                    </Tooltip>
                  </span>
                  <span>K{perOrderOverhead.toFixed(2)}</span>
                </div>
                <div className="border-t border-border my-1" />
                <div className="flex justify-between items-center font-semibold text-primary">
                  <span>Order Total</span>
                  <span>K{orderSubtotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="deposit" className="flex items-center gap-1.5">
                  Deposit (K)
                  <Tooltip>
                    <TooltipTrigger asChild><Info size={12} className="cursor-help text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">Amount collected upfront. The rest shows as Balance Due below.</TooltipContent>
                  </Tooltip>
                </Label>
                <Input id="deposit" type="number" min="0" step="0.01" placeholder="0.00" {...register("deposit")} className="mt-1 max-w-xs" />
              </div>

              {orderSubtotal > 0 && (
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    Balance Due
                    <Tooltip>
                      <TooltipTrigger asChild><Info size={12} className="cursor-help text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">Order Total minus Deposit — what&apos;s still owed on completion.</TooltipContent>
                    </Tooltip>
                  </span>
                  <span className={cn("font-bold text-base", balance < 0 ? "text-destructive" : "text-primary")}>
                    K{balance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => step === 1 ? router.back() : setStep((s) => s - 1)}>
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        <div className="flex items-center gap-2">
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => {
                if (step === 1 && !canAdvanceStep1()) {
                  toast.error("Please select a customer first");
                  return;
                }
                if (step === 2 && basket.length === 0) {
                  toast.error("Add at least one item");
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              Continue <ChevronRight size={15} className="ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} loading={isPending}>
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
    </TooltipProvider>
  );
}
