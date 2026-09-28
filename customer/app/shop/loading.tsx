import { CircularLoader } from "@/components/CustomerSkeleton";

export default function ShopLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <CircularLoader size={40} label="Loading shop…" />
    </div>
  );
}
