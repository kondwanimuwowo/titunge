import { MessageSquare, Bell, Phone, CheckCircle } from "lucide-react";
import { getInquiries, getInquiryStats } from "@/lib/data/inquiries";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import InquiriesList from "@/components/inquiries/InquiriesList";

export default async function InquiriesPage() {
  const { businessId } = await getBusinessContext();
  const [inquiries, stats] = await Promise.all([
    getInquiries(businessId),
    getInquiryStats(businessId),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Inquiries"
        description="Manage catalog inquiries and convert them to orders."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={<MessageSquare size={18} />}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title="New"
          value={stats.newCount}
          icon={<Bell size={18} />}
          color="yellow"
          delay={0.2}
        />
        <StatsCard
          title="Contacted"
          value={stats.contactedCount}
          icon={<Phone size={18} />}
          color="orange"
          delay={0.3}
        />
        <StatsCard
          title="Converted"
          value={stats.convertedCount}
          icon={<CheckCircle size={18} />}
          color="green"
          delay={0.4}
        />
      </div>

      <InquiriesList initialInquiries={inquiries} />
    </div>
  );
}
