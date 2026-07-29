import * as React from "react";

export const Table: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLTableElement> & {
      children?: React.ReactNode;
    }
>;

export const TableHeader: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLTableSectionElement> &
    React.RefAttributes<HTMLTableSectionElement> & {
      children?: React.ReactNode;
    }
>;

export const TableBody: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLTableSectionElement> &
    React.RefAttributes<HTMLTableSectionElement> & {
      children?: React.ReactNode;
    }
>;

export const TableFooter: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLTableSectionElement> &
    React.RefAttributes<HTMLTableSectionElement> & {
      children?: React.ReactNode;
    }
>;

export const TableRow: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLTableRowElement> &
    React.RefAttributes<HTMLTableRowElement> & {
      children?: React.ReactNode;
    }
>;

export const TableHead: React.ForwardRefExoticComponent<
  React.ThHTMLAttributes<HTMLTableCellElement> &
    React.RefAttributes<HTMLTableCellElement> & {
      children?: React.ReactNode;
    }
>;

export const TableCell: React.ForwardRefExoticComponent<
  React.TdHTMLAttributes<HTMLTableCellElement> &
    React.RefAttributes<HTMLTableCellElement> & {
      children?: React.ReactNode;
    }
>;

export const TableCaption: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLTableCaptionElement> &
    React.RefAttributes<HTMLTableCaptionElement> & {
      children?: React.ReactNode;
    }
>;
