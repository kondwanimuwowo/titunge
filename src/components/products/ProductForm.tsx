"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addProductAction,
  updateProductAction,
  uploadProductImageAction,
  deleteProductImageAction,
} from "@/app/actions/products";
import { Upload, X } from "lucide-react";

interface ProductFormProps {
  product?: Tables<"products"> | null;
}

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

interface PendingImage {
  file: File;
  preview: string;
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  // Already-uploaded images (edit mode: pre-filled from product; create mode: filled as uploads complete)
  const [imageGallery, setImageGallery] = useState<string[]>(() => {
    if (Array.isArray(product?.images)) {
      return (product.images as string[]).filter(Boolean);
    }
    return [];
  });

  // Images selected but not yet uploaded (create mode only — uploaded once the product is saved)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [pendingImages]);

  const { register, handleSubmit, control, formState: { errors } } = useForm<any>({
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

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const productType = data.customizable ? "custom_design" : "finished_good";

      if (product) {
        // Edit mode — images are already uploaded; just save the form + current gallery.
        const payload = {
          ...data,
          product_type: productType,
          images: imageGallery,
        };
        const result = await updateProductAction(product.id, payload);
        if (result.success) {
          toast.success("Product updated");
          router.push("/products");
        } else {
          toast.error(result.message || "Failed to save");
        }
        return;
      }

      // Create mode — create the row first, then upload any selected images and link them.
      const createResult = await addProductAction({
        ...data,
        product_type: productType,
        images: [],
      });

      if (!createResult.success || !createResult.productId) {
        toast.error(createResult.message || "Failed to create product");
        return;
      }

      const newProductId = createResult.productId;
      const uploadedUrls: string[] = [];

      for (const pending of pendingImages) {
        const formData = new FormData();
        formData.append("file", pending.file);
        formData.append("productId", newProductId);
        const uploadResult = await uploadProductImageAction(formData);
        if (uploadResult.success && uploadResult.url) {
          uploadedUrls.push(uploadResult.url);
        } else {
          toast.error(uploadResult.message || `Failed to upload ${pending.file.name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        await updateProductAction(newProductId, {
          images: uploadedUrls,
        });
      }

      toast.success("Product created");
      router.push("/products");
    });
  };

  const handlePendingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setPendingImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
    e.target.value = "";
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) return;
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", product.id);
    try {
      const result = await uploadProductImageAction(formData);
      if (result.success && result.url) {
        const newGallery = [...imageGallery, result.url];
        setImageGallery(newGallery);
        await updateProductAction(product.id, {
          images: newGallery,
        });
        toast.success("Image uploaded");
      } else {
        toast.error(result.message || "Failed to upload image");
      }
    } catch {
      toast.error("An error occurred while uploading");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = async (url: string, index: number) => {
    if (!product) return;
    setUploading(true);
    await deleteProductImageAction(url);
    const newGallery = imageGallery.filter((_, i) => i !== index);
    setImageGallery(newGallery);
    await updateProductAction(product.id, {
      images: newGallery,
    });
    toast.success("Image removed");
    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            {...register("name", { required: "Name is required" })}
            placeholder="e.g., Summer Dress"
            disabled={isPending}
          />
          {errors.name?.message && (
            <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          placeholder="Product details and specifications"
          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
          rows={3}
          disabled={isPending}
        />
      </div>

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

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox {...register("customizable")} disabled={isPending} />
          <span className="text-sm font-medium">Customizable Design</span>
        </label>
        <p className="text-xs text-muted-foreground -mt-2 ml-6">
          Checked = custom design (always shown in catalog). Unchecked = ready-to-wear finished good (shown while in stock).
        </p>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox {...register("active")} disabled={isPending} />
          <span className="text-sm font-medium">Active</span>
        </label>
      </div>

      <div className="border-t pt-4 space-y-3">
        <Label>Product Images</Label>

        {(imageGallery.length > 0 || pendingImages.length > 0) && (
          <div className="grid grid-cols-4 gap-2">
            {imageGallery.map((url, idx) => (
              <div key={`saved-${idx}`} className="relative aspect-square rounded border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url, idx)}
                  disabled={uploading || isPending}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {pendingImages.map((p, idx) => (
              <div key={`pending-${idx}`} className="relative aspect-square rounded border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt={`Pending ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Pending
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePendingImage(idx)}
                  disabled={isPending}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={product ? handleImageUpload : handlePendingFileSelect}
              disabled={uploading || isPending}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading
                  ? "Uploading..."
                  : product
                  ? "Click to upload image"
                  : "Click to add an image (uploaded when you save)"}
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/products")}
          disabled={isPending || uploading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isPending || uploading}>
          {product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
