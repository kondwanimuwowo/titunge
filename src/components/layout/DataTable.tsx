"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "./PageSkeleton";

export function EmptyStateNoResults({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1">No results found</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        {searchTerm
          ? `No items match your search for "${searchTerm}". Try a different term or clear the filter.`
          : "There are no items to display right now."}
      </p>
    </div>
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  /** Adds a checkbox column and enables the bulk-action toolbar below. */
  enableRowSelection?: boolean;
  /** Rendered in place of the toolbar's default content once rows are selected. */
  renderBulkActions?: (selected: TData[], clearSelection: () => void) => React.ReactNode;
  /** Enables the "Export CSV" button — maps a row to a flat object of column-name -> value. */
  getExportRow?: (row: TData) => Record<string, string | number | null | undefined>;
  exportFilename?: string;
}

function downloadCsv(filename: string, rows: Record<string, string | number | null | undefined>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn = "name",
  searchPlaceholder = "Filter...",
  onRowClick,
  loading = false,
  enableRowSelection = false,
  renderBulkActions,
  getExportRow,
  exportFilename = "export.csv",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const tableColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns;
    const selectColumn: ColumnDef<TData, TValue> = {
      id: "__select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
          }}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select all rows on this page"
          className="accent-primary h-3.5 w-3.5"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
          className="accent-primary h-3.5 w-3.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
    return [selectColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 px-5 border-b border-border/60 bg-muted/20 gap-3">
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm w-[280px] pl-9 bg-background focus-visible:ring-1"
            aria-label={searchPlaceholder}
          />
        </div>
        {getExportRow && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto bg-background gap-1.5"
            onClick={() => downloadCsv(exportFilename, table.getFilteredRowModel().rows.map((r) => getExportRow(r.original)))}
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={getExportRow ? "bg-background" : "ml-auto bg-background"} aria-label="Toggle column visibility">
              View Columns <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-sm py-1.5"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {enableRowSelection && selectedRows.length > 0 && renderBulkActions && (
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border/60 bg-primary/5">
          <span className="text-sm font-medium text-primary">{selectedRows.length} selected</span>
          {renderBulkActions(selectedRows, () => setRowSelection({}))}
        </div>
      )}
      <div className="bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/60">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="py-3">
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground",
                            header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground transition-colors"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          aria-label={
                            header.column.getCanSort()
                              ? `Sort by ${header.column.id}`
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="-ml-0.5">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-primary" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="h-3 w-3 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.15,
                      delay: Math.min(index * 0.02, 0.2), // cap delay so it's snappy
                    }}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={cn(
                      "border-b border-border/40 transition-colors hover:bg-muted/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 font-medium">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[350px] text-center"
                >
                  <EmptyStateNoResults
                    searchTerm={(table.getColumn(filterColumn)?.getFilterValue() as string) || ""}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-3 px-5 border-t border-border/60 bg-muted/10">
        <div className="flex-1 text-sm text-muted-foreground flex items-center gap-4">
          <span className="font-medium bg-muted px-2 py-0.5 rounded-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <span className="opacity-50 text-xs">|</span>
          <span>{table.getFilteredRowModel().rows.length} total rows</span>
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              <span className="opacity-50 text-xs">|</span>
              <span className="text-primary font-medium">
                {table.getFilteredSelectedRowModel().rows.length} selected
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
