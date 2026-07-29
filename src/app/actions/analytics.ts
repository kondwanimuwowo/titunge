"use server";

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
    getRevenueData(filters),
    getOrderStatusData(filters),
    getTopMaterials(filters),
    getEmployeeProductivity(filters),
    getProfitabilityData(filters),
    getAnalyticsStats(filters),
    getCustomerAnalytics(filters),
    getInventoryTurnover(filters),
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
