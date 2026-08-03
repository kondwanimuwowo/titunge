import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecycleBinItems } from "@/lib/data/recycleBin";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import RecycleBinList from "@/components/recycleBin/RecycleBinList";

export default async function RecycleBinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { businessId } = await getBusinessContext();
  const items = await getRecycleBinItems(businessId);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Recycle Bin"
        description="Deleted employees, customers, products, materials, orders, and production batches. Restore them or remove them permanently."
      />

      <RecycleBinList items={items} />
    </div>
  );
}
