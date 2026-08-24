"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Image from "next/image";
import { Star, ImageOff, Pencil, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";
import { updateProductStorefrontExtraAction } from "@/app/actions/storefront";

const UNSET = "__unset";

interface StorefrontProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  active: boolean | null;
  extra: {
    category_slug: string | null;
    care_instructions: string | null;
    shipping_lead_time: string | null;
    featured: boolean | null;
  } | null;
}

type FormValues = {
  category_slug: string;
  care_instructions: string;
  shipping_lead_time: string;
  featured: boolean;
};

function EditListingDialog({ product, onSaved }: { product: StorefrontProduct; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      category_slug: product.extra?.category_slug ?? UNSET,
      care_instructions: product.extra?.care_instructions ?? "",
      shipping_lead_time: product.extra?.shipping_lead_time ?? "",
      featured: product.extra?.featured ?? false,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateProductStorefrontExtraAction(product.id, {
        category_slug: data.category_slug === UNSET ? null : data.category_slug,
        care_instructions: data.care_instructions,
        shipping_lead_time: data.shipping_lead_time,
        featured: data.featured,
      });
      if (result.success) {
        toast.success("Marketplace listing saved");
        setOpen(false);
        onSaved();
      } else {
        toast.error(result.message || "Failed to save listing");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) reset(); }}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3 w-3" /> Edit listing
      </Button>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Marketplace listing</DialogTitle>
          <DialogDescription>How &quot;{product.name}&quot; appears on the public marketplace.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            {/* @ts-ignore */}
            <Label>Category</Label>
            <Controller
              name="category_slug"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET}>No category</SelectItem>
                    {MARKETPLACE_CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            {/* @ts-ignore */}
            <Label htmlFor="shipping_lead_time">Shipping lead time</Label>
            {/* @ts-ignore */}
            <Input id="shipping_lead_time" {...register("shipping_lead_time")} placeholder="Ships in 3-5 days" />
          </div>

          <div className="space-y-1.5">
            {/* @ts-ignore */}
            <Label htmlFor="care_instructions">Care instructions</Label>
            <textarea
              id="care_instructions"
              rows={2}
              {...register("care_instructions")}
              placeholder="Hand wash cold, hang dry."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("featured")} className="accent-primary" />
            Feature on homepage
          </label>

          <DialogFooter>
            {/* @ts-ignore */}
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            {/* @ts-ignore */}
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StorefrontProductsList({ products }: { products: StorefrontProduct[] }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace products</CardTitle>
        <CardDescription>
          Every active finished-good product is automatically listed on the public marketplace. Edit how each one appears here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No finished-good products yet. Add one under Products to have it appear on the marketplace.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {products.map((product) => {
              const category = MARKETPLACE_CATEGORIES.find((c) => c.slug === product.extra?.category_slug);
              return (
                <div key={product.id} className="py-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <ImageOff size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      {product.name}
                      {product.extra?.featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {!product.active && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 bg-amber-50 text-amber-700">
                          Inactive — hidden from marketplace
                        </Badge>
                      )}
                      {category ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{category.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No category set</span>
                      )}
                    </div>
                  </div>
                  <EditListingDialog product={product} onSaved={() => router.refresh()} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
