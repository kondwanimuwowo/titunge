import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

export const Select: typeof SelectPrimitive.Root;
export const SelectGroup: typeof SelectPrimitive.Group;
export const SelectValue: typeof SelectPrimitive.Value;

export const SelectTrigger: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLButtonElement> &
    React.RefAttributes<HTMLButtonElement> & {
      children?: React.ReactNode;
    }
>;

export const SelectScrollUpButton: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const SelectScrollDownButton: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const SelectContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      position?: "popper" | "item-aligned";
    }
>;

export const SelectLabel: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const SelectItem: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      value?: string;
      disabled?: boolean;
      children?: React.ReactNode;
    }
>;

export const SelectSeparator: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;
