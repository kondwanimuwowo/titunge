"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Ruler } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSizingStandardAction } from "@/app/actions/settings";

type SizingStandard = "not_specified" | "uk" | "us" | "aus";

const OPTIONS: { value: SizingStandard; label: string }[] = [
  { value: "not_specified", label: "Not specified" },
  { value: "uk", label: "UK sizing" },
  { value: "us", label: "US sizing" },
  { value: "aus", label: "Australian sizing" },
];

export default function SizingStandardToggle({ sizingStandard }: { sizingStandard: SizingStandard }) {
  const [current, setCurrent] = useState(sizingStandard);
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: SizingStandard) => {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await updateSizingStandardAction(next);
      if (result.success) {
        toast.success("Sizing standard saved");
      } else {
        setCurrent(previous);
        toast.error(result.message || "Failed to save");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Sizing standard</CardTitle>
        </div>
        <CardDescription>
          Which convention your Small/Medium/Large (and similar) product labels follow. UK, US and Australian sizes
          don&apos;t match. This just tells customers which one you&apos;re using; it doesn&apos;t convert anything.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={current} onValueChange={(v) => handleChange(v as SizingStandard)} disabled={isPending}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
