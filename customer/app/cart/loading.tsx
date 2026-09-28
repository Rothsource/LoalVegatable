import { CircularLoader } from "@/components/CustomerSkeleton";

export default function CartLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <CircularLoader size={38} label="Loading your basket…" />
    </div>
  );
}
