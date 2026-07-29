"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markInquiryContactedAction } from "@/app/actions/inquiries";

interface InquiryActionsProps {
  inquiry: any;
}

export default function InquiryActions({ inquiry }: InquiryActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkContacted = () => {
    startTransition(async () => {
      const result = await markInquiryContactedAction(inquiry.id);
      if (result.success) {
        toast.success("Marked as contacted");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update");
      }
    });
  };

  if (inquiry.status === "converted") return null;

  return (
    <div className="flex gap-3">
      {inquiry.status === "new" && (
        <Button
          variant="outline"
          onClick={handleMarkContacted}
          loading={isPending}
          className="gap-2"
        >
          <Phone className="h-4 w-4" />
          Mark as Contacted
        </Button>
      )}

      {(inquiry.status === "new" || inquiry.status === "contacted") && (
        <Link href={`/orders/new?inquiry_id=${inquiry.id}`}>
          <Button className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Convert to Order
          </Button>
        </Link>
      )}
    </div>
  );
}
