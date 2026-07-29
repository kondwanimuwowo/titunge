"use server";

import { revalidatePath } from "next/cache";
import { restoreEmployeeAction, hardDeleteEmployeeAction } from "./employees";
import { restoreCustomerAction, hardDeleteCustomerAction } from "./customers";
import { restoreProductAction, hardDeleteProductAction } from "./products";
import { restoreMaterialAction, hardDeleteMaterialAction } from "./inventory";
import { restoreOrder, hardDeleteOrder } from "./orders";
import { restoreBatchAction, hardDeleteBatchAction } from "./production";

export type RecycleBinType =
  | "employee"
  | "customer"
  | "product"
  | "material"
  | "order"
  | "production_batch";

export async function restoreRecycleBinItem(
  type: RecycleBinType,
  id: string
): Promise<{ success: boolean; message?: string }> {
  let result: { success: boolean; message?: string };

  switch (type) {
    case "employee":
      result = await restoreEmployeeAction(id);
      break;
    case "customer":
      result = await restoreCustomerAction(id);
      break;
    case "product":
      result = await restoreProductAction(id);
      break;
    case "material":
      result = await restoreMaterialAction(id);
      break;
    case "order":
      result = await restoreOrder(id);
      break;
    case "production_batch":
      result = await restoreBatchAction(id);
      break;
  }

  revalidatePath("/recycle-bin");
  return result;
}

export async function hardDeleteRecycleBinItem(
  type: RecycleBinType,
  id: string
): Promise<{ success: boolean; message?: string }> {
  let result: { success: boolean; message?: string };

  switch (type) {
    case "employee":
      result = await hardDeleteEmployeeAction(id);
      break;
    case "customer":
      result = await hardDeleteCustomerAction(id);
      break;
    case "product":
      result = await hardDeleteProductAction(id);
      break;
    case "material":
      result = await hardDeleteMaterialAction(id);
      break;
    case "order":
      result = await hardDeleteOrder(id);
      break;
    case "production_batch":
      result = await hardDeleteBatchAction(id);
      break;
  }

  revalidatePath("/recycle-bin");
  return result;
}
