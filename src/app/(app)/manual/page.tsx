"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Printer, 
  ChevronRight, 
  Menu, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MANUAL_SECTIONS } from "@/lib/data/manual";

export default function ManualPage() {
  const [activeSectionId, setActiveSectionId] = useState(MANUAL_SECTIONS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeSection = MANUAL_SECTIONS.find((s) => s.id === activeSectionId) || MANUAL_SECTIONS[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[hsl(46,70%,40%)] rounded-lg text-white">
                <BookOpen size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">User Manual</h1>
            </div>
            <p className="text-muted-foreground font-medium">
              Learn how to master Gloriaz Daughter ERP system.
            </p>
          </div>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2 border-[hsl(46,70%,40%)] text-[hsl(46,70%,40%)] hover:bg-[hsl(46,70%,40%)]/5 font-bold"
          >
            <Printer size={18} />
            Export to PDF
          </Button>
        </div>

        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden mb-4 print:hidden">
          <Button
            variant="secondary"
            className="w-full justify-between h-14"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <span className="flex items-center gap-3 font-semibold">
              <div className={cn("p-1.5 rounded-md", activeSection.bg, activeSection.color)}>
                {React.cloneElement(activeSection.icon as React.ReactElement, { size: 16 } as any)}
              </div>
              {activeSection.title}
            </span>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 relative">
          {/* Sidebar Navigation */}
          <aside
            className={cn(
              "w-full md:w-80 shrink-0 space-y-2 md:block print:hidden",
              isSidebarOpen ? "block" : "hidden"
            )}
          >
            <nav className="sticky top-8 bg-white border rounded-2xl p-3 shadow-xl shadow-black/5">
              <div className="space-y-1">
                {MANUAL_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setIsSidebarOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left group",
                      activeSectionId === section.id
                        ? "bg-[hsl(46,70%,40%)] text-white shadow-lg shadow-[hsl(46,70%,40%)]/20 font-semibold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        activeSectionId === section.id 
                          ? "bg-white/20" 
                          : cn("bg-muted", section.bg)
                      )}
                    >
                      {React.cloneElement(section.icon as React.ReactElement, {
                        size: 20,
                        className: activeSectionId === section.id ? "text-white" : section.color,
                      } as any)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold leading-none mb-1">{section.title}</div>
                      <div className={cn(
                        "text-[11px] opacity-70",
                        activeSectionId === section.id ? "text-white" : "text-muted-foreground"
                      )}>
                        {section.subtitle}
                      </div>
                    </div>
                    {activeSectionId === section.id && <ChevronRight size={16} className="opacity-50" />}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-dashed border-muted-foreground/20">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[hsl(46,70%,40%)] animate-pulse" />
                  Road Test Period
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  We update this manual weekly based on your feedback.
                </p>
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSectionId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-border/50 p-6 md:p-10 shadow-2xl shadow-black/5"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 pb-8 border-b">
                  <div className={cn("p-6 rounded-2xl shadow-inner", activeSection.bg, activeSection.color)}>
                    {React.cloneElement(activeSection.icon as React.ReactElement, { size: 40 } as any)}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                      {activeSection.title}
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium italic">
                      {activeSection.subtitle}
                    </p>
                  </div>
                </div>

                {/* Section Content */}
                <div className="animate-in fade-in duration-500">
                  {activeSection.content}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Print Only Title */}
            <div className="hidden print:block mb-8">
              <h1 className="text-4xl font-extrabold border-b-4 border-[hsl(46,70%,40%)] pb-4">
                Gloriaz Daughter ERP - User Manual
              </h1>
              <p className="mt-4 text-xl">Official Guide Section: {activeSection.title}</p>
            </div>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background-color: white !important; padding: 0 !important; margin: 0 !important; }
          main { width: 100% !important; margin: 0 !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
