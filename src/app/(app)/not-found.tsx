import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link href="/dashboard" className="mt-6">
        {/* @ts-ignore */}
        <Button className="gap-1.5">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
