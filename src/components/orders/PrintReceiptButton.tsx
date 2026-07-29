"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintReceiptButton() {
  return (
    // @ts-ignore
    <Button variant="secondary" onClick={() => window.print()} className="gap-1.5">
      <Printer className="h-4 w-4" />
      Print
    </Button>
  );
}
