"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Compass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resetTourAction } from "@/app/actions/tour";

export default function ReplayTourButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleReplay = () => {
    startTransition(async () => {
      const result = await resetTourAction();
      if (result.success) {
        toast.success("Tour will start on your next page visit");
        router.push("/dashboard");
      } else {
        toast.error(result.message || "Failed to reset the tour");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Product tour</CardTitle>
        </div>
        <CardDescription>Walk back through the sidebar basics</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" onClick={handleReplay} loading={isPending}>
          {isPending ? "Starting..." : "Replay tour"}
        </Button>
      </CardContent>
    </Card>
  );
}
