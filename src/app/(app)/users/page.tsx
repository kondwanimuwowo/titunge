import { getUsers, getPendingInvites } from "@/lib/data/users";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import UsersList from "@/components/users/UsersList";

export default async function UsersPage() {
  const { businessId } = await getBusinessContext();
  const [users, invites] = await Promise.all([
    getUsers(businessId),
    getPendingInvites(businessId),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="User Management"
        description="Manage system users and roles"
      />
      <UsersList initialUsers={users} initialInvites={invites} />
    </div>
  );
}
