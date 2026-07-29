import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export const Tabs: typeof TabsPrimitive.Root;

export const TabsList: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
    }
>;

export const TabsTrigger: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLButtonElement> &
    React.RefAttributes<HTMLButtonElement> & {
      value?: string;
      disabled?: boolean;
      children?: React.ReactNode;
    }
>;

export const TabsContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      value?: string;
      children?: React.ReactNode;
    }
>;
