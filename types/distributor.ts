export type DistributorStatus = "Active" | "Inactive";

export type Distributor = {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  phone: string;
  deliveryArea: string;
  status: DistributorStatus;
  createdAt: string;
};

export type DistributorFormValues = {
  name: string;
  email: string;
  phone: string;
  deliveryArea: string;
  password: string;
  status: DistributorStatus;
};

export type DistributorRow = {
  id?: unknown;
  merchant_id?: unknown;
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  delivery_area?: unknown;
  status?: unknown;
  created_at?: unknown;
};
