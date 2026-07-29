import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-64 w-full max-w-lg rounded-xl" />
    </div>
  );
}
