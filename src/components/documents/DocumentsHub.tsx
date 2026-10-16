"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Receipt, Plus, Banknote } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import DocumentList from "@/components/documents/DocumentList";

interface DocumentsHubProps {
  quotations: any[];
  invoices: any[];
  stats: any;
  initialTab: "quotations" | "invoices";
}

export default function DocumentsHub({ quotations, invoices, stats, initialTab }: DocumentsHubProps) {
  const [tab, setTab] = useState(initialTab);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "quotations" | "invoices")} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TabsList className="grid grid-cols-2 sm:w-fit">
          <TabsTrigger value="quotations" className="gap-2">
            <FileText size={16} />
            Quotations
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt size={16} />
            Invoices
          </TabsTrigger>
        </TabsList>

        <Link href={`/documents/new?type=${tab === "quotations" ? "quotation" : "invoice"}`}>
          <Button className="gap-1.5">
            <Plus size={15} /> New {tab === "quotations" ? "Quotation" : "Invoice"}
          </Button>
        </Link>
      </div>

      <TabsContent value="quotations" className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Total Quotations"
              value={stats.totalQuotations}
              icon={<FileText size={18} />}
              color="blue"
              delay={0.1}
            />
            <StatsCard
              title="Accepted"
              value={stats.acceptedQuotations}
              icon={<FileText size={18} />}
              color="green"
              delay={0.2}
            />
          </div>
        )}
        <DocumentList documents={quotations} type="quotation" />
      </TabsContent>

      <TabsContent value="invoices" className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Total Invoices"
              value={stats.totalInvoices}
              icon={<Receipt size={18} />}
              color="blue"
              delay={0.1}
            />
            <StatsCard
              title="Outstanding"
              value={`K${stats.outstandingAmount.toLocaleString()}`}
              icon={<Banknote size={18} />}
              color="orange"
              delay={0.2}
            />
          </div>
        )}
        <DocumentList documents={invoices} type="invoice" />
      </TabsContent>
    </Tabs>
  );
}
