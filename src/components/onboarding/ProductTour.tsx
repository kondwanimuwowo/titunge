"use client";

import { useState, useEffect } from "react";
import { Joyride, EVENTS, STATUS, type Step, type EventHandler } from "react-joyride";
import { markTourSeenAction } from "@/app/actions/tour";
import type { UserRole } from "@/lib/types/database";

const BASE_STEPS: Step[] = [
  {
    target: '[data-tour="nav-dashboard"]',
    content: "This is your dashboard — a quick overview of what's happening in your business.",
    skipBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-sales"]',
    content: "Orders, Marketplace Orders and Inquiries all live under Sales.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-catalog"]',
    content: "Products, Inventory and Production — everything about what you make and sell.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-group-people"]',
    content: "Customers, Employees and Users, grouped together.",
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

interface ProductTourProps {
  hasSeenTour: boolean;
  role: UserRole;
}

export default function ProductTour({ hasSeenTour, role }: ProductTourProps) {
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

  const steps = role === "employee" ? BASE_STEPS : [...BASE_STEPS, INSIGHTS_STEP];

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
        zIndex: 10000,
      }}
    />
  );
}
