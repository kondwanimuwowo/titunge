import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-6 md:px-8 py-10 md:py-16">
      <Skeleton className="h-3 w-32 mb-10" />
      <ProductDetailSkeleton />
    </div>
  );
}
