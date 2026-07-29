import { CatalogSkeleton } from "@/components/ui/Skeleton";

export default function CatalogLoading() {
  return (
    <div className="flex flex-col">
      <section className="pt-12 pb-8 md:pt-16 md:pb-12 bg-background">
        <div className="container mx-auto px-6 md:px-8">
          <div className="animate-pulse space-y-3">
            <div className="h-2.5 w-16 bg-secondary/80" />
            <div className="h-10 w-56 bg-secondary/80" />
            <div className="w-12 h-px bg-border mt-6" />
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32 bg-background">
        <div className="container mx-auto px-6 md:px-8">
          <CatalogSkeleton />
        </div>
      </section>
    </div>
  );
}
