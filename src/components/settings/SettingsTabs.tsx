"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, DollarSign, Scissors, Warehouse, Store, CreditCard } from "lucide-react";
import FinancialSettingsForm from "./FinancialSettingsForm";
import BrandingTab from "./BrandingTab";
import StorefrontProfileForm from "./StorefrontProfileForm";
import StorefrontProductsList from "./StorefrontProductsList";
import PayoutProfileForm from "./PayoutProfileForm";
import BillingTab from "./BillingTab";
import WorkspaceFocusToggle from "./WorkspaceFocusToggle";
import GarmentTypesManager from "@/components/finance/GarmentTypesManager";

interface SettingsTabsProps {
  financialSettings: {
    custom_hourly_rate?: number;
    default_profit_margin?: number;
    expected_monthly_orders?: number;
    tax_rate?: number;
  } | null;
  garmentTypes: any[];
  business: {
    name: string;
    slug: string;
    theme_key: string;
    logo_url?: string | null;
    plan: "free" | "team";
    focus: "full_erp" | "marketplace_only";
  };
  storefront: {
    bio: string | null;
    location: string | null;
    founded_year: number | null;
    delivery_policy: string | null;
    returns_policy: string | null;
    custom_orders_policy: string | null;
    banner_url: string | null;
  } | null;
  storefrontProducts: any[];
  seatCount: number;
  payoutProfile: {
    payout_method: string | null;
    account_details: Record<string, unknown> | null;
    verified_at: string | null;
  } | null;
  seatPriceKwacha: number;
  billingProfile: { payment_method: string | null; account_details: Record<string, unknown> | null } | null;
  billingCharges: { id: string; period: string; seat_count: number; amount: number; status: string }[];
  banks: { id: string; name: string; country: string }[];
}

export default function SettingsTabs({
  financialSettings,
  garmentTypes,
  business,
  storefront,
  storefrontProducts,
  seatCount,
  payoutProfile,
  seatPriceKwacha,
  billingProfile,
  billingCharges,
  banks,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid grid-cols-6 lg:w-[820px]">
        <TabsTrigger value="general" className="gap-2">
          <Warehouse size={16} />
          General
        </TabsTrigger>
        <TabsTrigger value="branding" className="gap-2">
          <Palette size={16} />
          Branding
        </TabsTrigger>
        <TabsTrigger value="financial" className="gap-2">
          <DollarSign size={16} />
          Financial
        </TabsTrigger>
        <TabsTrigger value="workshop" className="gap-2">
          <Scissors size={16} />
          Workshop
        </TabsTrigger>
        <TabsTrigger value="marketplace" className="gap-2">
          <Store size={16} />
          Marketplace
        </TabsTrigger>
        <TabsTrigger value="billing" className="gap-2">
          <CreditCard size={16} />
          Billing
        </TabsTrigger>
      </TabsList>

      {/* General */}
      <TabsContent value="general" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Public information about your workshop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Business Name</p>
                <p className="text-sm font-medium text-foreground">{business.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subdomain</p>
                <p className="text-sm font-medium text-foreground">{business.slug}.titunge.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <WorkspaceFocusToggle focus={business.focus} />

        <Card>
          <CardHeader>
            <CardTitle>System Appearance</CardTitle>
            <CardDescription>Customize the look and feel of your ERP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
              </div>
              <Badge variant="secondary" className="">Managed by browser</Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Branding */}
      <TabsContent value="branding">
        <BrandingTab
          currentThemeKey={business.theme_key}
          logoUrl={business.logo_url}
          businessName={business.name}
        />
      </TabsContent>

      {/* Financial */}
      <TabsContent value="financial" className="space-y-4">
        <FinancialSettingsForm settings={financialSettings} />
      </TabsContent>

      {/* Workshop */}
      <TabsContent value="workshop" className="space-y-4">
        <GarmentTypesManager initialTypes={garmentTypes} />
      </TabsContent>

      {/* Marketplace */}
      <TabsContent value="marketplace" className="space-y-4">
        <StorefrontProfileForm storefront={storefront} businessName={business.name} businessSlug={business.slug} />
        <PayoutProfileForm profile={payoutProfile} banks={banks} />
        <StorefrontProductsList products={storefrontProducts} />
      </TabsContent>

      {/* Billing */}
      <TabsContent value="billing" className="space-y-4">
        <BillingTab
          plan={business.plan}
          seatCount={seatCount}
          seatPriceKwacha={seatPriceKwacha}
          billingProfile={billingProfile}
          charges={billingCharges}
        />
      </TabsContent>
    </Tabs>
  );
}
