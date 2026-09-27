export type DeliveryStatus = "incoming" | "accepted" | "arrived" | "completed";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DeliveryLocation = {
  label: string;
  address: string;
  coordinates?: Coordinates;
};

export type DeliveryOrderItem = {
  name: string;
  quantity: number;
  unit: string;
};

export type DeliveryRequest = {
  id: string;
  status: DeliveryStatus;
  receivedAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  distanceKm: number;
  estimatedMinutes: number;
  pickup: DeliveryLocation;
  destination: DeliveryLocation;
  customer: {
    name: string;
    phone: string;
  };
  items: DeliveryOrderItem[];
  note?: string;
};

export type DeliveryHistoryItem = DeliveryRequest & {
  status: "arrived" | "completed";
  completedAt: string;
};

export type DeliveryNotification = {
  id: string;
  deliveryId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type DeliveryUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountStatus: "active" | "offline";
  available: boolean;
};

export type DemoDeliveryState = {
  user: DeliveryUser | null;
  incoming: DeliveryRequest[];
  current: DeliveryRequest | null;
  history: DeliveryHistoryItem[];
  notifications: DeliveryNotification[];
  activationEmail: string;
  password: string;
};

export type ServiceResult = {
  ok: boolean;
  message?: string;
};
