import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Package, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/business-context";
import { getProductById } from "@/lib/data/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductDeleteButton from "@/components/products/ProductDeleteButton";

async function getProductOrders(productId: string) {
  const supabase = await createClient();
  const { data } = await (supabase.from("orders") as any)
    .select("id, order_number, status, total_cost, created_at, customers(name)")
    .eq("product_id", productId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();

  const [product, orders] = await Promise.all([
    getProductById(businessId, id),
    getProductOrders(id),
  ]);

  if (!product) notFound();

  const gallery: string[] = Array.isArray(product.images)
    ? (product.images as string[]).filter(Boolean)
    : [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href="/products">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{product.name}</span>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/products/${id}/edit`}>
            {/* @ts-ignore */}
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          </Link>
          <ProductDeleteButton productId={id} productName={product.name} />
        </div>
      </div>

      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border">
            {gallery[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gallery[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(1).map((url, idx) => (
                <div key={idx} className="aspect-square rounded-lg border border-border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${product.name} ${idx + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-start gap-3 mb-2">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <Badge variant={product.active ? "default" : "secondary"} className="mt-1 shrink-0">
                {product.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {product.category && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {product.category}
              </div>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Price</p>
              <p className="text-xl font-bold text-primary">
                K{parseFloat(String(product.price || 0)).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Stock Quantity</p>
              <p className="text-xl font-bold">
                {parseInt(String(product.stock_quantity || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders using this product */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Orders</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No orders reference this product yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="text-primary hover:underline font-medium">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.customers?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize text-xs">{order.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      K{parseFloat(String(order.total_cost || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
