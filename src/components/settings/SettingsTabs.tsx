"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, DollarSign, Scissors, Warehouse } from "lucide-react";
import FinancialSettingsForm from "./FinancialSettingsForm";
import BrandingTab from "./BrandingTab";
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
  };
}

export default function SettingsTabs({ financialSettings, garmentTypes, business }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid grid-cols-4 lg:w-[580px]">
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
    </Tabs>
  );
}
