"use client";

import { useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Upload, Check, Loader2, ImageOff } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { THEME_LIST } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import { updateTheme, uploadLogo } from "@/app/actions/settings";

interface BrandingTabProps {
  currentThemeKey: string;
  logoUrl?: string | null;
  businessName: string;
}

export default function BrandingTab({ currentThemeKey, logoUrl, businessName }: BrandingTabProps) {
  const [activeTheme, setActiveTheme] = useState<string>(currentThemeKey);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [isPendingTheme, startThemeTransition] = useTransition();
  const [isPendingLogo, startLogoTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleThemeSelect = (key: ThemeKey) => {
    if (key === activeTheme) return;
    setActiveTheme(key);
    startThemeTransition(async () => {
      const result = await updateTheme(key);
      if (result.success) {
        toast.success("Theme updated — refresh to see the full effect");
      } else {
        toast.error(result.message ?? "Failed to update theme");
        setActiveTheme(currentThemeKey);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewLogo(objectUrl);

    const formData = new FormData();
    formData.append("logo", file);
    startLogoTransition(async () => {
      const result = await uploadLogo(formData);
      if (result.success) {
        toast.success("Logo uploaded");
      } else {
        toast.error(result.message ?? "Upload failed");
        setPreviewLogo(null);
      }
    });
  };

  const displayLogo = previewLogo ?? logoUrl;

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Business Logo</CardTitle>
          <CardDescription>Shown in the sidebar and on printed documents. PNG or SVG recommended, max 2 MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {displayLogo ? (
              <Image src={displayLogo} alt={businessName} width={80} height={80} className="object-contain w-full h-full" />
            ) : (
              <ImageOff size={24} className="text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={isPendingLogo}
              className="gap-2"
            >
              {isPendingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {isPendingLogo ? "Uploading…" : "Upload logo"}
            </Button>
            {displayLogo && (
              <p className="text-xs text-muted-foreground">Click upload to replace the current logo.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme picker */}
      <Card>
        <CardHeader>
          <CardTitle>Color Theme</CardTitle>
          <CardDescription>Choose a color palette for your workspace. Applied instantly across the ERP.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEME_LIST.map((theme) => {
              const isActive = theme.key === activeTheme;
              return (
                <motion.button
                  key={theme.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeSelect(theme.key)}
                  disabled={isPendingTheme}
                  className={cn(
                    "relative rounded-lg border-2 p-3 text-left transition-all",
                    isActive
                      ? "border-foreground shadow-md"
                      : "border-border hover:border-foreground/40"
                  )}
                >
                  {/* Swatch */}
                  <div
                    className="w-full h-8 rounded mb-2"
                    style={{ backgroundColor: `hsl(${theme.primary})` }}
                  />
                  <p className="text-xs font-medium text-foreground leading-tight">{theme.name}</p>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                      <Check size={11} className="text-background" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {isPendingTheme && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Saving theme…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
