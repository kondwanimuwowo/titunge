"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-warm-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar translate-x-[-50%] translate-y-[-50%] rounded-[28px] border border-border bg-background p-8 shadow-2xl md:w-full"
          >
            <div className="flex flex-col space-y-1 mb-6">
              <h2 className="text-xl font-serif font-semibold tracking-tight">
                {title}
              </h2>
              <div className="w-12 h-px bg-primary mt-2" />
            </div>
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
