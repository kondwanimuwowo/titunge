"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { addBatchLogAction, updateBatchStatusAction } from "@/app/actions/production";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Truck } from "lucide-react";

interface BatchDetailsViewProps {
  batch: any;
}

const STATUSES = [
  "cutting",
  "stitching",
  "finishing",
  "quality_check",
  "completed",
];

export default function BatchDetailsView({ batch }: BatchDetailsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("timeline");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    startTransition(async () => {
      const result = await addBatchLogAction(batch.id, "comment", newComment);
      if (result.success) {
        setNewComment("");
        router.refresh();
        toast.success("Comment added");
      } else {
        toast.error(result.message || "Failed to add comment");
      }
    });
  };

  const handleNextStage = async () => {
    const currentIndex = STATUSES.indexOf(batch.status);
    if (currentIndex < STATUSES.length - 1) {
      const nextStatus = STATUSES[currentIndex + 1];
      startTransition(async () => {
        const result = await updateBatchStatusAction(batch.id, nextStatus);
        if (result.success) {
          toast.success(`Moved to ${nextStatus}`);
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update");
        }
      });
    }
  };

  const totalMaterialCost = (batch.production_materials || []).reduce(
    (sum: number, m: any) => sum + (m.cost || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Quantity</p>
          <p className="text-2xl font-bold">{batch.quantity}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-lg font-semibold capitalize">{batch.status.replace("_", " ")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Material Cost</p>
          <p className="text-lg font-semibold">K{totalMaterialCost.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Labor Cost</p>
          <p className="text-lg font-semibold">K{parseFloat(String(batch.labor_cost || 0)).toFixed(2)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="materials">Materials & Costing</TabsTrigger>
          <TabsTrigger value="quality">Quality & Notes</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(batch.production_logs || []).map((log: any) => (
              <div key={log.id} className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium capitalize text-sm">{log.action.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                    {log.user_profiles && (
                      <p className="text-xs text-gray-600 mt-1">
                        by {log.user_profiles.name}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <form onSubmit={handleAddComment} className="border-t pt-4 space-y-2">
            <Label htmlFor="comment">Add Update</Label>
            <div className="flex gap-2">
              <Input
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or update..."
                disabled={isPending}
              />
              <Button type="submit" loading={isPending} disabled={!newComment.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Materials Used</h4>
            <div className="space-y-2">
              {(batch.production_materials || []).map((mat: any) => (
                <div key={mat.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <p className="font-medium text-sm">{mat.materials?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {mat.quantity_used} {mat.materials?.unit}
                    </p>
                  </div>
                  <p className="font-semibold">K{(mat.cost || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Material Cost:</span>
                <span className="font-semibold">K{totalMaterialCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Labor Cost:</span>
                <span className="font-semibold">
                  K{parseFloat(String(batch.labor_cost || 0)).toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span className="text-primary">
                  K{(totalMaterialCost + parseFloat(String(batch.labor_cost || 0))).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Started</Label>
              <p className="text-sm text-muted-foreground">
                {batch.started_at ? new Date(batch.started_at).toLocaleString() : "Not started"}
              </p>
            </div>

            {batch.completed_at && (
              <div>
                <Label>Completed</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(batch.completed_at).toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <Label>Production Stages</Label>
              <div className="space-y-2 mt-2">
                {(batch.production_stages || []).map((stage: any) => (
                  <div key={stage.id} className="text-sm border rounded p-2">
                    <p className="font-medium capitalize">{stage.stage_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Status: {stage.status || "pending"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="border-t pt-4 flex gap-2">
        {batch.status !== "completed" && batch.status !== "cancelled" && (
          <Button
            onClick={handleNextStage}
            disabled={isPending}
            className="gap-2"
          >
            <Truck className="h-4 w-4" />
            Next Stage
          </Button>
        )}
      </div>
    </div>
  );
}
