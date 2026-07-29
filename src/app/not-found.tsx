import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <h1 className="text-xl font-bold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
