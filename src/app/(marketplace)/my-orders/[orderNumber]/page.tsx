import { OrderDetailClient } from "@/components/marketplace/OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderDetailClient orderNumber={decodeURIComponent(orderNumber)} />;
}
