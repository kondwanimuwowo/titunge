"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import { toggleWishlistAction } from "@/app/actions/marketplace-wishlist";

export function WishlistToggleButton({
  productId,
  initialWishlisted = false,
  variant = "icon",
}: {
  productId: string;
  initialWishlisted?: boolean;
  variant?: "icon" | "text";
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (!result.success) {
        toast.error(result.message || "Failed to update wishlist");
        return;
      }
      setWishlisted(result.wishlisted ?? false);
      if (variant === "text") router.refresh();
    });
  };

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0e1a18] disabled:opacity-50"
      >
        <Heart size={13} fill={wishlisted ? "#5fa8a0" : "none"} stroke="#5fa8a0" />
        {wishlisted ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors disabled:opacity-50"
    >
      <Heart size={16} fill={wishlisted ? "#5fa8a0" : "none"} stroke="#5fa8a0" strokeWidth={1.75} />
    </button>
  );
}
