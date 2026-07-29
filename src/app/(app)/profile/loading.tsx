import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      <Skeleton className="h-6 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-64 w-full max-w-lg rounded-xl" />
    </div>
  );
}
