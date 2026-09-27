import React from "react";
import { FullPageLoader } from "@/components/CustomerSkeleton";

export default function Loading() {
  return <FullPageLoader size={48} label="Loading fresh produce…" />;
}
