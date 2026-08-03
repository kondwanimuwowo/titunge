"use server";

import { requireBusinessContext } from "@/lib/business-context";
import {
  getRevenueData,
  getOrderStatusData,
  getTopMaterials,
  getEmployeeProductivity,
  getProfitabilityData,
  getAnalyticsStats,
  getCustomerAnalytics,
  getInventoryTurnover,
  type AnalyticsFilters,
} from "@/lib/data/analytics";

export async function getAnalyticsDataAction(filters: AnalyticsFilters) {
  const { businessId } = await requireBusinessContext();

  const [
    revenueData,
    statusData,
    topMaterials,
    productivity,
    profitData,
    stats,
    customerAnalytics,
    inventoryTurnover,
  ] = await Promise.all([
    getRevenueData(businessId, filters),
    getOrderStatusData(businessId, filters),
    getTopMaterials(businessId, filters),
    getEmployeeProductivity(businessId, filters),
    getProfitabilityData(businessId, filters),
    getAnalyticsStats(businessId, filters),
    getCustomerAnalytics(businessId, filters),
    getInventoryTurnover(businessId, filters),
  ]);

  return {
    revenueData,
    statusData,
    topMaterials,
    productivity,
    profitData,
    stats,
    customerAnalytics,
    inventoryTurnover,
  };
}
