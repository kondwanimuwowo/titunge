"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-1.5 w-full max-w-sm">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      {hasAction && <Skeleton className="h-9 w-32" />}
    </div>
  );
}

export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-xl" />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return <Skeleton className="h-[400px] w-full rounded-xl" />;
}

export function ChartRowSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-[400px] w-full rounded-xl" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}

export function PageSkeleton({ 
  layout = "table", 
  statsCount = 4, 
  hasAction = true 
}: { 
  layout?: "table" | "charts" | "cards";
  statsCount?: number;
  hasAction?: boolean;
}) {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <HeaderSkeleton hasAction={hasAction} />
      {statsCount > 0 && <StatsRowSkeleton count={statsCount} />}
      {layout === "table" && <TableSkeleton />}
      {layout === "charts" && (
        <>
          <ChartRowSkeleton />
          <ChartRowSkeleton />
        </>
      )}
      {layout === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
}
