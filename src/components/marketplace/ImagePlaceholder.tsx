import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  shape?: "rect" | "circle";
  className?: string;
}

export function ImagePlaceholder({ shape = "rect", className }: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[#f0efed]",
        shape === "circle" ? "rounded-full" : "rounded-xl",
        className
      )}
    >
      <ImageIcon size={20} className="text-[#b8b3ad]" strokeWidth={1.5} />
    </div>
  );
}
