import { PageSkeleton } from "@/components/layout/PageSkeleton";
export default function Loading() {
  return <PageSkeleton layout="table" statsCount={0} hasAction={true} />;
}
