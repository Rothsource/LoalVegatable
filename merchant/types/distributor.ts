// types/distributor.ts
export type DistributorStatus = "Pending" | "Active" | "Inactive";

export type Distributor = {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  status: DistributorStatus;
  createdAt: string;
};

export type DistributorFormValues = {
  name: string;
  email: string;
};

export type DistributorRow = {
  id?: unknown;
  merchant_id?: unknown;
  full_name?: unknown;
  email?: unknown;
  status?: unknown;
  created_at?: unknown;
};