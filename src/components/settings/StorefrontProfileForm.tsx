"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Save, Upload, Loader2, ImageOff } from "lucide-react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStorefrontProfileAction, uploadStorefrontBannerAction } from "@/app/actions/storefront";

interface StorefrontProfileFormProps {
  storefront: {
    bio: string | null;
    location: string | null;
    founded_year: number | null;
    delivery_policy: string | null;
    returns_policy: string | null;
    custom_orders_policy: string | null;
    banner_url: string | null;
  } | null;
  businessName: string;
  businessSlug: string;
}

type FormValues = {
  bio: string;
  location: string;
  founded_year: string;
  delivery_policy: string;
  returns_policy: string;
  custom_orders_policy: string;
};

export default function StorefrontProfileForm({ storefront, businessName, businessSlug }: StorefrontProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isPendingBanner, startBannerTransition] = useTransition();
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      bio: storefront?.bio ?? "",
      location: storefront?.location ?? "",
      founded_year: storefront?.founded_year ? String(storefront.founded_year) : "",
      delivery_policy: storefront?.delivery_policy ?? "",
      returns_policy: storefront?.returns_policy ?? "",
      custom_orders_policy: storefront?.custom_orders_policy ?? "",
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateStorefrontProfileAction({
        bio: data.bio,
        location: data.location,
        founded_year: data.founded_year ? parseInt(data.founded_year, 10) : null,
        delivery_policy: data.delivery_policy,
        returns_policy: data.returns_policy,
        custom_orders_policy: data.custom_orders_policy,
      });
      if (result.success) toast.success("Storefront profile saved");
      else toast.error(result.message || "Failed to save storefront profile");
    });
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Banner must be under 4 MB");
      return;
    }
    setPreviewBanner(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("banner", file);
    startBannerTransition(async () => {
      const result = await uploadStorefrontBannerAction(formData);
      if (result.success) toast.success("Banner uploaded");
      else {
        toast.error(result.message || "Upload failed");
        setPreviewBanner(null);
      }
    });
  };

  const displayBanner = previewBanner ?? storefront?.banner_url;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop banner</CardTitle>
          <CardDescription>Shown at the top of your public shop page at titunge.com/shop/{businessSlug}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="w-40 h-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {displayBanner ? (
              <Image src={displayBanner} alt={businessName} width={160} height={80} className="object-cover w-full h-full" />
            ) : (
              <ImageOff size={20} className="text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            {/* @ts-ignore */}
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isPendingBanner} className="gap-2">
              {isPendingBanner ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {isPendingBanner ? "Uploading…" : "Upload banner"}
            </Button>
            <p className="text-xs text-muted-foreground">Wide image recommended, max 4 MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shop profile</CardTitle>
          <CardDescription>Public bio and policies buyers see on your shop page.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              {/* @ts-ignore */}
              <Label htmlFor="bio">Shop bio</Label>
              <textarea
                id="bio"
                rows={3}
                {...register("bio")}
                placeholder="What you make, in a sentence or two."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                {/* @ts-ignore */}
                <Label htmlFor="location">Location</Label>
                {/* @ts-ignore */}
                <Input id="location" {...register("location")} placeholder="Lusaka, Zambia" />
              </div>
              <div className="space-y-1.5">
                {/* @ts-ignore */}
                <Label htmlFor="founded_year">Founded (year)</Label>
                {/* @ts-ignore */}
                <Input id="founded_year" type="number" {...register("founded_year")} placeholder="2020" />
              </div>
            </div>

            <div className="space-y-1.5">
              {/* @ts-ignore */}
              <Label htmlFor="delivery_policy">Delivery policy</Label>
              <textarea
                id="delivery_policy"
                rows={2}
                {...register("delivery_policy")}
                placeholder="Most pieces are made to order and ship within 3-5 days."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              {/* @ts-ignore */}
              <Label htmlFor="returns_policy">Returns policy</Label>
              <textarea
                id="returns_policy"
                rows={2}
                {...register("returns_policy")}
                placeholder="Returns accepted within 7 days if unworn with tags attached."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              {/* @ts-ignore */}
              <Label htmlFor="custom_orders_policy">Custom orders policy</Label>
              <textarea
                id="custom_orders_policy"
                rows={2}
                {...register("custom_orders_policy")}
                placeholder="Custom sizing and colour requests are welcome — message the shop before ordering."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="pt-2">
              {/* @ts-ignore */}
              <Button type="submit" loading={isPending} className="gap-2">
                {!isPending && <Save className="h-4 w-4" />}
                {isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
