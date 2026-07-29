import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero skeleton */}
      <section className="relative h-[100vh] w-full flex items-center justify-center overflow-hidden bg-warm-black">
        <div className="flex flex-col items-center text-center space-y-6">
          <Skeleton className="h-3 w-40 bg-white/10" />
          <Skeleton className="h-16 w-[500px] max-w-[80vw] bg-white/10" />
          <Skeleton className="h-16 w-[400px] max-w-[60vw] bg-white/10" />
          <Skeleton className="h-4 w-[350px] max-w-[70vw] bg-white/10 mt-4" />
          <div className="flex gap-4 mt-8">
            <Skeleton className="h-14 w-48 bg-white/10" />
            <Skeleton className="h-14 w-52 bg-white/10" />
          </div>
        </div>
      </section>

      {/* Featured section skeleton */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6 md:px-8">
          <div className="space-y-3 mb-16">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <Skeleton className="aspect-[3/4] w-full mb-4" />
                <Skeleton className="h-2.5 w-16 mb-2" />
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
