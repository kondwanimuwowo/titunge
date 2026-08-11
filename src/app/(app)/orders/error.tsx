"use client";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
      <AlertCircle size={32} />
      <p className="text-sm">Something went wrong loading this page.</p>
      <button onClick={reset} className="text-sm text-primary hover:underline">Try again</button>
    </div>
  );
}
