import { ShieldAlert } from "lucide-react";

export default function SuspendedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldAlert className="text-destructive" size={22} />
      </div>
      <h1 className="text-xl font-bold text-foreground">This business has been suspended</h1>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
        Your business&apos;s access to Titunge has been paused. Contact support at{" "}
        <a href="mailto:hello@titunge.com" className="text-primary hover:underline">
          hello@titunge.com
        </a>{" "}
        if you believe this is a mistake.
      </p>
    </div>
  );
}
