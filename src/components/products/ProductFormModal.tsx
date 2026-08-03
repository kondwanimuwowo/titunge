"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  addProductAction,
  updateProductAction,
  uploadProductImageAction,
  deleteProductImageAction,
} from "@/app/actions/products";
import { Upload, X } from "lucide-react";

interface ProductFormModalProps {
  product?: Tables<"products"> | null;
  onClose: () => void;
}

type FormData = any;

const CATEGORIES = [
  "Dresses",
  "Suits",
  "Shirts",
  "Trousers",
  "Skirts",
  "Jackets",
  "Accessories",
  "Other",
];

export default function ProductFormModal({ product, onClose }: ProductFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [imageGallery, setImageGallery] = useState<string[]>(() => {
    if (Array.isArray(product?.images)) {
      return (product.images as string[]).filter(Boolean);
    }
    return [];
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          stock_quantity: product.stock_quantity,
          active: product.active,
          customizable: product.product_type === "custom_design",
        }
      : {
          active: true,
          stock_quantity: 0,
          customizable: false,
        },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const payload = {
        ...data,
        images: imageGallery,
      };

      const result = product
        ? await updateProductAction(product.id, payload)
        : await addProductAction(payload);

      if (result.success) {
        toast.success(product ? "Product updated" : "Product created");
        router.refresh();
        onClose();
      } else {
        toast.error(result.message || "Failed to save");
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) {
      toast.error("Save product first before uploading images");
      return;
    }

    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Create FormData to pass to Server Action
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", product.id);

    try {
      const result = await uploadProductImageAction(formData);

      if (result.success && result.url) {
        setImageGallery([...imageGallery, result.url]);
        toast.success("Image uploaded");
      } else {
        toast.error(result.message || "Failed to upload image");
      }
    } catch (err: any) {
      console.error("Upload error in component:", err);
      toast.error("An error occurred while uploading. Please check the console.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (url: string, index: number) => {
    setUploading(true);
    await deleteProductImageAction(url);
    setImageGallery(imageGallery.filter((_, i) => i !== index));
    toast.success("Image removed");
    setUploading(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update product details and inventory"
              : "Create a new product in the catalog"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="e.g., Summer Dress"
                disabled={isPending}
              />
              {errors.name?.message && <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="w-full px-3 py-2 border rounded-md text-sm"
                disabled={isPending}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Product details and specifications"
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Pricing */}
          <div>
            <Label htmlFor="price">Price (K) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { required: true })}
              placeholder="0.00"
              disabled={isPending}
            />
          </div>

          {/* Inventory & Options */}
          <div className="border-t pt-4 space-y-4">
            <div>
              <Label htmlFor="stockQty">Stock Quantity</Label>
              <Input
                id="stockQty"
                type="number"
                step="1"
                {...register("stock_quantity")}
                placeholder="0"
                disabled={isPending}
              />
            </div>

            <label className="flex items-center gap-2">
              <Checkbox {...register("customizable")} disabled={isPending} />
              <span className="text-sm font-medium">Customizable Design</span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox {...register("active")} disabled={isPending} />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          {/* Image Gallery */}
          {product && (
            <div className="border-t pt-4 space-y-3">
              <Label>Product Images</Label>

              {/* Image Grid */}
              {imageGallery.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {imageGallery.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded border overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url, idx)}
                        disabled={uploading}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload */}
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || isPending}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload image"}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending || uploading}>
              {isPending ? "Saving..." : product ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
