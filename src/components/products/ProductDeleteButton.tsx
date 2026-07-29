"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/app/actions/products";

interface ProductDeleteButtonProps {
  productId: string;
  productName: string;
}

export default function ProductDeleteButton({ productId, productName }: ProductDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.success) {
        toast.success("Product deleted");
        router.push("/products");
      } else {
        toast.error(result.message || "Failed to delete");
      }
    });
  };

  return (
    // @ts-ignore
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
    >
      <Trash2 className="h-4 w-4" /> Delete
    </Button>
  );
}
