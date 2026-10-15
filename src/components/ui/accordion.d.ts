import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

export const Accordion: typeof AccordionPrimitive.Root;

export const AccordionItem: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      value: string;
      disabled?: boolean;
      children?: React.ReactNode;
    }
>;

export const AccordionTrigger: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLButtonElement> &
    React.RefAttributes<HTMLButtonElement> & {
      children?: React.ReactNode;
    }
>;

export const AccordionContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
    }
>;
