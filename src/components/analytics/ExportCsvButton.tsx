"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportCsvButtonProps {
  filename: string;
  rows: Record<string, string | number>[];
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: string | number) => {
    const str = String(val ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export function ExportCsvButton({ filename, rows }: ExportCsvButtonProps) {
  const handleExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="h-8 text-xs gap-1.5"
    >
      <Download size={13} /> Export CSV
    </Button>
  );
}
