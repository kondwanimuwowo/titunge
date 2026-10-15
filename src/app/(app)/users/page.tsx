import { getUsers, getPendingInvites } from "@/lib/data/users";
import { getBusinessContext } from "@/lib/business-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import UsersList from "@/components/users/UsersList";

export default async function UsersPage() {
  const { businessId } = await getBusinessContext();
  const supabase = await createClient();
  const [users, invites, { data: platformSettings }] = await Promise.all([
    getUsers(businessId),
    getPendingInvites(businessId),
    (supabase.from("platform_settings") as any).select("seat_price_kwacha").eq("id", true).single(),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="User Management"
        description="Manage system users and roles"
      />
      <UsersList
        initialUsers={users}
        initialInvites={invites}
        seatPriceKwacha={platformSettings?.seat_price_kwacha ?? 250}
      />
    </div>
  );
}
