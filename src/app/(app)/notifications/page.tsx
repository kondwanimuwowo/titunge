import { getNotifications } from "@/lib/data/notifications";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import NotificationsList from "@/components/notifications/NotificationsList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { businessId } = await getBusinessContext();
  const notifications = await getNotifications(businessId);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Notifications"
        description="Manage your system notifications and updates"
      />
      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
