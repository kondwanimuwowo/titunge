"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Trash2, Save, AlertTriangle, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderMaterialsAction } from "@/app/actions/orders";

interface MaterialOption {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface Row {
  material_id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  quantity_used: number;
}

interface BillOfMaterialsEditorProps {
  orderId: string;
  orderStatus: string;
  initialMaterials: any[];
  availableMaterials: MaterialOption[];
}

function toRows(initialMaterials: any[]): Row[] {
  return initialMaterials.map((m: any) => ({
    material_id: m.material_id,
    name: m.materials?.name || "Unknown material",
    unit: m.materials?.unit || "",
    cost_per_unit: parseFloat(String(m.materials?.cost_per_unit || 0)),
    quantity_used: parseFloat(String(m.quantity_used || 0)),
  }));
}

export default function BillOfMaterialsEditor({
  orderId,
  orderStatus,
  initialMaterials,
  availableMaterials,
}: BillOfMaterialsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<Row[]>(() => toRows(initialMaterials));
  const [dirty, setDirty] = useState(false);
  const [addingId, setAddingId] = useState<string>("");
  const [editMode, setEditMode] = useState(false);

  const stockAlreadyDeducted = ["production", "fitting", "completed", "delivered"].includes(orderStatus);
  const canAdjust = !stockAlreadyDeducted;

  const usedIds = new Set(rows.map((r) => r.material_id));
  const addOptions = availableMaterials.filter((m) => !usedIds.has(m.id));

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + r.quantity_used * r.cost_per_unit, 0),
    [rows]
  );

  const updateQty = (materialId: string, qty: number) => {
    setRows((prev) => prev.map((r) => (r.material_id === materialId ? { ...r, quantity_used: qty } : r)));
    setDirty(true);
  };

  const removeRow = (materialId: string) => {
    setRows((prev) => prev.filter((r) => r.material_id !== materialId));
    setDirty(true);
  };

  const addRow = (materialId: string) => {
    const mat = availableMaterials.find((m) => m.id === materialId);
    if (!mat) return;
    setRows((prev) => [
      ...prev,
      { material_id: mat.id, name: mat.name, unit: mat.unit, cost_per_unit: mat.cost_per_unit, quantity_used: 1 },
    ]);
    setAddingId("");
    setDirty(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateOrderMaterialsAction(
        orderId,
        rows.map((r) => ({ material_id: r.material_id, quantity_used: r.quantity_used }))
      );
      if (result.success) {
        toast.success("Bill of materials updated");
        setDirty(false);
        setEditMode(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update materials");
      }
    });
  };

  const handleCancelEdit = () => {
    setRows(toRows(initialMaterials));
    setDirty(false);
    setEditMode(false);
  };

  if (rows.length === 0 && addOptions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Bill of Materials
          </span>
          <div className="flex items-center gap-2">
            {editMode && dirty && (
              <Button size="sm" onClick={handleSave} loading={isPending} className="h-8 gap-1.5">
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </Button>
            )}
            {editMode ? (
              <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isPending} className="h-8 gap-1.5">
                <X className="h-3.5 w-3.5" />
                {dirty ? "Cancel" : "Done"}
              </Button>
            ) : (
              canAdjust && (
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="h-8 gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Adjust Material Qty
                </Button>
              )
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {editMode && stockAlreadyDeducted && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Stock was already deducted for this order. Changes here update the cost record only — adjust inventory manually if quantities change.
          </div>
        )}

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No materials assigned yet.</p>
        ) : editMode ? (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.material_id}
                className="flex items-center gap-3 p-3 bg-card border border-border/60 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{row.name}</p>
                  <p className="text-xs text-muted-foreground">K{row.cost_per_unit.toFixed(2)} / {row.unit}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.quantity_used}
                    onChange={(e) => updateQty(row.material_id, parseFloat(e.target.value) || 0)}
                    className="h-8 w-20 text-sm text-right"
                    disabled={isPending}
                  />
                  <span className="text-xs text-muted-foreground w-10">{row.unit}</span>
                </div>
                <p className="font-bold text-primary text-sm w-20 text-right shrink-0">
                  K{(row.quantity_used * row.cost_per_unit).toFixed(2)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.material_id)}
                  disabled={isPending}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t border-border/60">
              <p className="text-sm font-bold text-foreground">
                Total: <span className="text-primary">K{total.toFixed(2)}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((row) => (
              <div
                key={row.material_id}
                className="p-3 bg-card border border-border/60 rounded-xl shadow-sm hover:border-primary/50 transition-colors"
              >
                <p className="font-semibold text-foreground text-sm truncate" title={row.name}>
                  {row.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">
                    {row.quantity_used.toFixed(2)} {row.unit}
                  </p>
                  <p className="font-bold text-primary text-sm">
                    K{(row.quantity_used * row.cost_per_unit).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {editMode && addOptions.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Select value={addingId} onValueChange={addRow}>
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue placeholder="Add a material..." />
              </SelectTrigger>
              <SelectContent>
                {addOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} (K{m.cost_per_unit.toFixed(2)}/{m.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
