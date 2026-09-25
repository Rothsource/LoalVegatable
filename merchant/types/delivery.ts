export type DeliveryStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Packaging"
  | "Delivering"
  | "Delivered";

export type DeliveryOrder = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: DeliveryStatus;
  createdAt: string;
};

export type MerchantProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string;
  active: boolean;
};
