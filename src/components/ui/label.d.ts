import * as React from "react";
import { VariantProps } from "class-variance-authority";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  children?: React.ReactNode;
}

export const Label: React.ForwardRefExoticComponent<
  LabelProps & React.RefAttributes<HTMLLabelElement>
>;
