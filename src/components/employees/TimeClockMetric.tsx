"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function TimeClockMetric() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date();
      const zambiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Harare" }));
      const timeString = zambiaTime.toLocaleTimeString("en-ZM", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTime(timeString);
    };

    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4 bg-primary/10 border-primary/20">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Current Time (Zambia)</p>
          <p className="text-2xl font-mono font-bold">{time || "—:—:—"}</p>
        </div>
      </div>
    </Card>
  );
}
