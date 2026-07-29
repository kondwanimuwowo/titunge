import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

export const DropdownMenu: typeof DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger: typeof DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup: typeof DropdownMenuPrimitive.Group;
export const DropdownMenuPortal: typeof DropdownMenuPrimitive.Portal;
export const DropdownMenuSub: typeof DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup: typeof DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuSubTrigger: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const DropdownMenuSubContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const DropdownMenuContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      sideOffset?: number;
      align?: "start" | "center" | "end";
    }
>;

export const DropdownMenuItem: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      disabled?: boolean;
      asChild?: boolean;
      children?: React.ReactNode;
    }
>;

export const DropdownMenuCheckboxItem: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      checked?: boolean | "indeterminate";
      onCheckedChange?: (checked: boolean | "indeterminate") => void;
      children?: React.ReactNode;
    }
>;

export const DropdownMenuRadioItem: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      value?: string;
      children?: React.ReactNode;
    }
>;

export const DropdownMenuLabel: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const DropdownMenuSeparator: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const DropdownMenuShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
