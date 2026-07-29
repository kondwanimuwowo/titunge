import { getProductById, getFinishedGoodById, getAllProductIds } from "@/services/catalogService";
import { ProductDetailClient } from "@/components/catalog/ProductDetailClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

export async function generateStaticParams() {
  const ids = await getAllProductIds();
  return ids.map((id) => ({ id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const isFinishedGood = id.startsWith('rtw-');
  const actualId = isFinishedGood ? id.replace('rtw-', '') : id;

  let product = null;

  if (isFinishedGood) {
    product = await getFinishedGoodById(actualId);
  } else {
    product = await getProductById(actualId);
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-6 md:px-8 py-6 md:py-16">
      <div className="pt-16 md:pt-0 mb-10">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Collection
        </Link>
      </div>

      <ProductDetailClient product={product} isFinishedGood={isFinishedGood} />
    </div>
  );
}
