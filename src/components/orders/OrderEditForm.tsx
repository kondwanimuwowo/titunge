"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Search, X, Package, Scissors, ShoppingBag, DollarSign, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { updateOrderAction } from "@/app/actions/orders";

const UNASSIGNED = "__unassigned";

interface SelectedMaterial {
  material_id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  quantity_used: number;
  cost: number;
}

interface FormData {
  customer_id: string;
  order_type: "custom" | "product";
  garment_type_id: string;
  product_id: string;
  assigned_tailor_id: string;
  due_date: string;
  description: string;
  notes: string;
  total_cost: string;
  deposit: string;
}

interface Props {
  order: any;
  customers: any[];
  employees: any[];
  products: any[];
  garmentTypes: any[];
  materials: any[];
  financialSettings: any;
  perOrderOverhead: number;
}

export default function OrderEditForm({
  order,
  customers,
  employees,
  products,
  garmentTypes,
  materials,
  financialSettings,
  perOrderOverhead,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialOrderType = order.product_id ? "product" : "custom";

  const { register, control, watch, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      customer_id: order.customers?.id ?? order.customer_id ?? "",
      order_type: initialOrderType,
      garment_type_id: order.garment_type_id ?? "",
      product_id: order.product_id ?? "",
      assigned_tailor_id: order.assigned_tailor_id || UNASSIGNED,
      due_date: order.due_date ? order.due_date.split("T")[0] : "",
      description: order.description ?? "",
      notes: order.notes ?? "",
      total_cost: order.total_cost ? String(parseFloat(order.total_cost).toFixed(2)) : "",
      deposit: order.deposit ? String(parseFloat(order.deposit).toFixed(2)) : "",
    },
  });

  // Initialise with existing materials
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>(
    (order.materials || []).map((m: any) => ({
      material_id: m.material_id ?? m.materials?.id,
      name: m.materials?.name ?? "Unknown",
      unit: m.materials?.unit ?? "",
      cost_per_unit: parseFloat(m.materials?.cost_per_unit ?? m.cost_per_unit ?? "0"),
      quantity_used: parseFloat(m.quantity_used ?? "0"),
      cost: parseFloat(m.cost ?? "0"),
    }))
  );
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  const orderType = watch("order_type");
  const watchedGarmentTypeId = watch("garment_type_id");
  const watchedTotalCost = watch("total_cost");
  const watchedDeposit = watch("deposit");

  // Cost calculations
  const materialCost = selectedMaterials.reduce((s, m) => s + m.cost, 0);
  const selectedGarmentType = garmentTypes.find((g: any) => g.id === watchedGarmentTypeId);
  const labourCost = selectedGarmentType
    ? parseFloat(selectedGarmentType.base_labour_cost || "0")
    : (financialSettings?.custom_hourly_rate || 0) * 2;
  const baseCost = materialCost + labourCost + perOrderOverhead;
  const margin = financialSettings?.default_profit_margin || 30;
  const recommendedPrice = parseFloat((baseCost * (1 + margin / 100)).toFixed(2));
  const totalCost = parseFloat(watchedTotalCost || "0");
  const balance = totalCost - parseFloat(watchedDeposit || "0");

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

  const handleSubmit = () => {
    const values = getValues();
    if (!values.total_cost || parseFloat(values.total_cost) <= 0) {
      toast.error("Please enter a selling price");
      return;
    }

    startTransition(async () => {
      const result = await updateOrderAction(order.id, {
        customer_id: values.customer_id,
        garment_type_id: orderType === "custom" ? values.garment_type_id || null : null,
        product_id: orderType === "product" ? values.product_id || null : null,
        assigned_tailor_id: values.assigned_tailor_id === UNASSIGNED ? null : values.assigned_tailor_id || null,
        due_date: values.due_date || null,
        total_cost: parseFloat(values.total_cost),
        deposit: parseFloat(values.deposit || "0"),
        description: values.description,
        notes: values.notes,
        materials: selectedMaterials.map((m) => ({
          material_id: m.material_id,
          quantity_used: m.quantity_used,
          cost: m.cost,
        })),
      });

      if (result.success) {
        toast.success("Order updated");
        router.push(`/orders/${order.id}`);
      } else {
        toast.error(result.message || "Failed to update order");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Customer */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users size={15} className="text-primary" /> Customer
        </h2>
        <div>
          <Label htmlFor="customer_id">Customer</Label>
          <Controller
            name="customer_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="customer_id" className="mt-1 w-full h-9">
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` · ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Garment */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Scissors size={15} className="text-primary" /> Garment Details
        </h2>

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
            <Label htmlFor="garment_type_id">Garment Type</Label>
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
            <Label htmlFor="product_id">Product</Label>
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
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <Label htmlFor="notes">Internal Notes</Label>
          <textarea
            id="notes"
            {...register("notes")}
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      {/* Materials */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Package size={15} className="text-primary" /> Materials
        </h2>

        <div className="relative">
          <div className="flex items-center border border-input rounded-md bg-background px-3 gap-2 h-9">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search materials to add..."
              value={materialSearch}
              onChange={(e) => { setMaterialSearch(e.target.value); setShowMaterialDropdown(e.target.value.length > 0); }}
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
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted/50 flex justify-between items-center"
                >
                  <span>{m.name}</span>
                  <span className="text-xs text-muted-foreground">K{parseFloat(m.cost_per_unit || "0").toFixed(2)}/{m.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedMaterials.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            {selectedMaterials.map((m) => (
              <div key={m.material_id} className="px-3 py-2.5 border-b border-border last:border-0 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 text-sm font-medium">{m.name}</div>
                <div className="col-span-4 flex items-center gap-1">
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
                <div className="col-span-2 text-right text-sm font-semibold text-primary">K{m.cost.toFixed(2)}</div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => setSelectedMaterials((p) => p.filter((x) => x.material_id !== m.material_id))}
                    className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-muted/20 px-3 py-2 flex justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Materials Total</span>
              <span className="text-sm font-bold text-primary">K{materialCost.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign size={15} className="text-primary" /> Pricing
        </h2>

        <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Material Cost</span><span>K{materialCost.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Labour Cost</span><span>K{labourCost.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Overhead</span><span>K{perOrderOverhead.toFixed(2)}</span></div>
          <div className="border-t border-border my-1" />
          <div className="flex justify-between font-medium"><span>Base Cost</span><span>K{baseCost.toFixed(2)}</span></div>
          {recommendedPrice > 0 && (
            <div className="flex justify-between font-semibold text-primary">
              <span>Recommended ({margin}% margin)</span>
              <div className="flex items-center gap-2">
                <span>K{recommendedPrice.toFixed(2)}</span>
                <button type="button" onClick={() => setValue("total_cost", recommendedPrice.toFixed(2))}
                  className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20">Use</button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total_cost">Selling Price (K) *</Label>
            <Input id="total_cost" type="number" min="0" step="0.01" {...register("total_cost")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="deposit">Deposit (K)</Label>
            <Input id="deposit" type="number" min="0" step="0.01" {...register("deposit")} className="mt-1" />
          </div>
        </div>

        {totalCost > 0 && (
          <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm">
            <span className="font-medium">Balance Due</span>
            <span className={cn("font-bold text-base", balance < 0 ? "text-destructive" : "text-primary")}>
              K{balance.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} loading={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
