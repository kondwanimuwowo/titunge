import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

declare const Checkbox: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    disabled?: boolean;
  } & React.RefAttributes<React.ElementRef<typeof CheckboxPrimitive.Root>>
>;

export { Checkbox };
