import { getBusinessContext } from "@/lib/business-context";
import { getUnreadCount, getNotifications } from "@/lib/data/notifications";
import NotificationBell from "./NotificationBell";

export default async function NotificationBellServer() {
  const { businessId } = await getBusinessContext();
  const [unreadCount, recentNotifications] = await Promise.all([
    getUnreadCount(businessId),
    getNotifications(businessId, 5),
  ]);
  return (
    <NotificationBell
      initialUnreadCount={unreadCount}
      initialNotifications={recentNotifications}
    />
  );
}
