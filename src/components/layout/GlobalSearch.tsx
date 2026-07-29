"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Users,
  Package,
  Boxes,
  Briefcase,
  MessageSquare,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  badge?: string;
}
interface ResultGroup {
  type: string;
  label: string;
  items: ResultItem[];
}

const GROUP_META: Record<string, { icon: typeof Search; color: string }> = {
  orders: { icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
  customers: { icon: Users, color: "bg-violet-50 text-violet-600" },
  products: { icon: Package, color: "bg-emerald-50 text-emerald-600" },
  materials: { icon: Boxes, color: "bg-amber-50 text-amber-600" },
  employees: { icon: Briefcase, color: "bg-rose-50 text-rose-600" },
  inquiries: { icon: MessageSquare, color: "bg-cyan-50 text-cyan-600" },
};

const QUICK_ACTIONS = [
  { label: "New Order", href: "/orders/new", icon: ShoppingBag },
  { label: "New Material", href: "/inventory/materials/new", icon: Boxes },
  { label: "New Production Batch", href: "/production/new", icon: Package },
  { label: "New Employee", href: "/employees/new", icon: Briefcase },
  { label: "New Expense", href: "/finance/expenses/new", icon: Plus },
];

const RECENT_KEY = "gd-recent-searches";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  if (typeof window === "undefined") return;
  const existing = loadRecent().filter((q) => q.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...existing].slice(0, MAX_RECENT);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<ResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setGroups([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setGroups(data.groups || []);
        setActiveIndex(0);
      } catch (err: any) {
        if (err.name !== "AbortError") setGroups([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback(
    (item: ResultItem) => {
      saveRecent(query.trim() || item.title);
      setOpen(false);
      router.push(item.href);
    },
    [query, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flatItems.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) handleSelect(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showEmptyState = query.trim().length >= 2 && !loading && groups.length === 0;
  const showIdle = query.trim().length < 2;

  let runningIndex = -1;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 w-full max-w-sm h-9 px-3 rounded-full border border-border/70 bg-muted/40 hover:bg-muted/70 hover:border-border transition-all text-left"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground flex-1 truncate">
          Search orders, customers, products...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-border/70 bg-background text-[10px] font-medium text-muted-foreground shrink-0 group-hover:border-primary/30">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content asChild forceMount onKeyDown={handleKeyDown}>
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed left-1/2 top-[12vh] z-[101] w-[92vw] max-w-xl -translate-x-1/2 rounded-2xl border border-border/60 bg-card shadow-2xl ring-1 ring-black/5 overflow-hidden"
                >
                  <DialogPrimitive.Title className="sr-only">Global Search</DialogPrimitive.Title>

                  {/* Search input */}
                  <div className="flex items-center gap-3 px-4 h-14 border-b border-border/60">
                    {loading ? (
                      <Loader2 className="h-4.5 w-4.5 text-primary shrink-0 animate-spin" />
                    ) : (
                      <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                    )}
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search orders, customers, products, materials..."
                      className="flex-1 h-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={() => setOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Results */}
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar py-2">
                    {showIdle && (
                      <div className="px-2">
                        {recent.length > 0 && (
                          <div className="mb-2">
                            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                              Recent
                            </p>
                            {recent.map((r) => (
                              <button
                                key={r}
                                onClick={() => setQuery(r)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted/60 transition-colors text-left"
                              >
                                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-foreground truncate">{r}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div>
                          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                            Quick Actions
                          </p>
                          {QUICK_ACTIONS.map((qa) => (
                            <button
                              key={qa.href}
                              onClick={() => {
                                setOpen(false);
                                router.push(qa.href);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted/60 transition-colors text-left"
                            >
                              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                <qa.icon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <span className="text-foreground">{qa.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {showEmptyState && (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <Sparkles className="h-6 w-6 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-foreground font-medium">No results for "{query}"</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try a different name, order number, or phone number
                        </p>
                      </div>
                    )}

                    {groups.map((group) => {
                      const meta = GROUP_META[group.type];
                      const Icon = meta?.icon || Search;
                      return (
                        <div key={group.type} className="px-2 mb-1">
                          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                            {group.label}
                          </p>
                          {group.items.map((item) => {
                            runningIndex += 1;
                            const isActive = runningIndex === activeIndex;
                            return (
                              <button
                                key={item.id}
                                onMouseEnter={() => setActiveIndex(runningIndex)}
                                onClick={() => handleSelect(item)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                  isActive ? "bg-primary/10" : "hover:bg-muted/60"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    meta?.color || "bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                                </div>
                                {isActive && (
                                  <CornerDownLeft className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer hints */}
                  <div className="flex items-center gap-4 px-4 h-10 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <CornerDownLeft className="h-3 w-3" /> Select
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <kbd className="px-1 py-0.5 rounded border border-border/70 bg-background text-[10px]">esc</kbd>
                      Close
                    </span>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </>
  );
}
