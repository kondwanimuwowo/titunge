import { Skeleton } from "@/components/ui/Skeleton";

export default function AboutLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero skeleton */}
      <section className="relative h-[60vh] w-full flex items-center justify-center bg-warm-black">
        <div className="text-center space-y-4">
          <Skeleton className="h-3 w-20 mx-auto bg-white/10" />
          <Skeleton className="h-14 w-64 mx-auto bg-white/10" />
        </div>
      </section>

      {/* Content skeleton */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6 md:px-8 max-w-3xl space-y-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5 mx-auto" />
          <div className="w-12 h-px bg-border mx-auto my-8" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-16">
            <Skeleton className="aspect-[4/5]" />
            <Skeleton className="aspect-[4/5]" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </section>
    </div>
  );
}
