import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBatchById } from "@/lib/data/production";
import { PageHeader } from "@/components/layout/PageHeader";
import BatchDetailsView from "@/components/production/BatchDetailsView";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const batch = await getBatchById(id);

  if (!batch) {
    redirect("/production");
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={`Batch ${batch.batch_number}`}
        description={batch.products?.name || "Production Batch"}
      />

      <BatchDetailsView batch={batch} />
    </div>
  );
}
