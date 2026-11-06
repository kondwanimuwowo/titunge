"use client";

import { useState, useEffect } from "react";
import { Joyride, EVENTS, STATUS, type Step, type EventHandler } from "react-joyride";
import { markTourSeenAction } from "@/app/actions/tour";
import type { UserRole } from "@/lib/types/database";

const FULL_ERP_STEPS: Step[] = [
  {
    target: '[data-tour="nav-dashboard"]',
    content: "This is your dashboard, a quick overview of what's happening in your business.",
    skipBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-sales"]',
    content: "Orders (including marketplace orders), Inquiries and Documents live under Sales.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-catalog"]',
    content: "Products, Inventory and Production cover everything you make and sell.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-people"]',
    content: "Customers, Employees and Users, grouped together.",
    placement: "right",
  },
];

// Marketplace-only businesses see a shorter sidebar (no People group, no
// inventory or production), so their tour only points at what's there.
const MARKETPLACE_STEPS: Step[] = [
  {
    target: '[data-tour="nav-dashboard"]',
    content: "Your dashboard shows marketplace sales, orders waiting for you, new buyer questions, and what's left to set up.",
    skipBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-sales"]',
    content: "Orders lists what buyers have paid for, with their phone number. Inquiries holds questions buyers send from your shop.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-catalog"]',
    content: "Add your products here. Any active product with a photo is listed on the marketplace automatically.",
    placement: "right",
  },
];

// Insights (Finance/Analytics) is admin/manager only — added conditionally
// so the tour never points at a group an employee can't see.
const INSIGHTS_STEP: Step = {
  target: '[data-tour="nav-group-insights"]',
  content: "Finance and Analytics live here when you're ready for them.",
  placement: "right",
};

const MARKETPLACE_INSIGHTS_STEP: Step = {
  target: '[data-tour="nav-group-insights"]',
  content: "Analytics shows your marketplace sales over time.",
  placement: "right",
};

// Settings lives in the collapsible sidebar footer, so this step isn't
// anchored to it.
const SETTINGS_STEP: Step = {
  target: "body",
  content: "Before your first sale, open Settings at the bottom of the sidebar to add your shop details, province, and payout account. Help & Manual is there too.",
  placement: "center",
};

interface ProductTourProps {
  hasSeenTour: boolean;
  role: UserRole;
  focus: "full_erp" | "marketplace_only";
}

export default function ProductTour({ hasSeenTour, role, focus }: ProductTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (hasSeenTour) return;
    // Let the sidebar finish its first paint so Joyride can find targets.
    const timer = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(timer);
  }, [hasSeenTour]);

  const handleEvent: EventHandler = (data) => {
    if (data.type === EVENTS.TOUR_END && (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED)) {
      setRun(false);
      markTourSeenAction();
    }
  };

  if (!run) return null;

  const isMarketplaceOnly = focus === "marketplace_only";
  const steps =
    role === "employee"
      ? isMarketplaceOnly
        ? MARKETPLACE_STEPS.slice(0, 2) // employees can't see Products, so Catalog is empty for them
        : FULL_ERP_STEPS
      : isMarketplaceOnly
        ? [...MARKETPLACE_STEPS, MARKETPLACE_INSIGHTS_STEP, SETTINGS_STEP]
        : [...FULL_ERP_STEPS, INSIGHTS_STEP, SETTINGS_STEP];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      options={{
        primaryColor: "hsl(174, 28%, 52%)",
        showProgress: true,
        buttons: ["back", "close", "primary", "skip"],
        // Without this, the X button just advances to the next step instead
        // of ending the tour — status never reaches SKIPPED, so it never
        // gets marked seen and reruns on every refresh.
        closeButtonAction: "skip",
        zIndex: 10000,
      }}
    />
  );
}
