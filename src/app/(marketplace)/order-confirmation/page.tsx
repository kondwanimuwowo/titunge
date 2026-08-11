import { Suspense } from "react";
import { OrderConfirmationClient } from "@/components/marketplace/OrderConfirmationClient";

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <OrderConfirmationClient />
    </Suspense>
  );
}
