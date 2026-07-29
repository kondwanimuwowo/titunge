"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
        An unexpected error occurred while loading this page. You can try again, or head back to the dashboard.
      </p>
      <div className="flex items-center gap-3 mt-6">
        {/* @ts-ignore */}
        <Button variant="outline" onClick={() => reset()} className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Link href="/dashboard">
          {/* @ts-ignore */}
          <Button className="gap-1.5">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
