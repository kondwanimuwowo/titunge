"use client";
import { Search, PackageOpen, FileQuestion, Users, ShoppingBag } from "lucide-react";
import { Button } from "./button";
import { motion } from "framer-motion";

export function EmptyState({
    title,
    description,
    icon: Icon = FileQuestion,
    action,
    className = ""
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/5 rounded-xl border-2 border-dashed border-muted/50 ${className}`}
        >
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-muted/5">
                <Icon className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-6 leading-relaxed">
                {description}
            </p>
            {action && (
                <Button onClick={action.onClick} variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-shadow">
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}

// Preset configurations for common empty states
EmptyState.NoResults = ({ searchTerm, action }) => (
    <EmptyState
        icon={Search}
        title="No matches found"
        description={`We couldn't find anything matching "${searchTerm}". Try adjusting your filters or search term.`}
        action={action}
    />
);

EmptyState.NoOrders = ({ action }) => (
    <EmptyState
        icon={ShoppingBag}
        title="No orders yet"
        description="Your order list is empty. Start by creating a new order for a customer or pre-designed garment."
        action={action}
    />
);

EmptyState.NoInventory = ({ action }) => (
    <EmptyState
        icon={PackageOpen}
        title="Inventory is empty"
        description="You haven't added any raw materials or finished goods yet. Add materials to start tracking stock."
        action={action}
    />
);

EmptyState.NoCustomers = ({ action }) => (
    <EmptyState
        icon={Users}
        title="No customers found"
        description="Your customer database is currently empty. Add your first customer to start tracking measurements and orders."
        action={action}
    />
);
