import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-secondary/80", className)}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[3/4] w-full mb-4" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="flex flex-col pt-2 md:pt-8 space-y-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <div className="w-12 h-px bg-border" />
        <Skeleton className="h-6 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-14 w-64" />
        <div className="border-t border-border pt-8 space-y-6">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* Sidebar skeleton */}
      <aside className="w-full md:w-56 shrink-0 space-y-10">
        <div className="space-y-4">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-2.5 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-2.5 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </aside>

      {/* Grid skeleton */}
      <div className="flex-1 space-y-8">
        <div className="flex justify-between items-center pb-6 border-b border-border">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
