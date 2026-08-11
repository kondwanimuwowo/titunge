import { Suspense } from "react";
import { BrowseClient } from "@/components/marketplace/BrowseClient";

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseClient />
    </Suspense>
  );
}
