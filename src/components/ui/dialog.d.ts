import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const Dialog: typeof DialogPrimitive.Root;
export const DialogPortal: typeof DialogPrimitive.Portal;
export const DialogClose: typeof DialogPrimitive.Close;
export const DialogTrigger: typeof DialogPrimitive.Trigger;

export const DialogOverlay: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export const DialogContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
    }
>;

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;

export const DialogTitle: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLHeadingElement> &
    React.RefAttributes<HTMLHeadingElement>
>;

export const DialogDescription: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLParagraphElement> &
    React.RefAttributes<HTMLParagraphElement>
>;
