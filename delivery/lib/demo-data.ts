import type {
  DeliveryHistoryItem,
  DeliveryNotification,
  DeliveryRequest,
  DeliveryUser,
  DemoDeliveryState,
} from "@/lib/types";

// Development-only credentials and data used to demonstrate the frontend.
export const DEMO_AUTH = {
  authorizedEmail: "sokha.rider@gmail.com",
  password: "Rider123!",
  verificationCode: "246810",
} as const;

export const DEMO_USER: DeliveryUser = {
  id: "rider-demo-01",
  name: "Sokha Chea",
  email: DEMO_AUTH.authorizedEmail,
  phone: "+855 12 456 890",
  accountStatus: "active",
  available: true,
};

export const DEMO_INCOMING_DELIVERY: DeliveryRequest = {
  id: "DLV-2048",
  status: "incoming",
  receivedAt: "2026-08-13T09:42:00+07:00",
  distanceKm: 4.8,
  estimatedMinutes: 18,
  pickup: {
    label: "Green Basket Farm",
    address: "Street 598, Toul Kork, Phnom Penh",
    coordinates: { latitude: 11.58135, longitude: 104.90072 },
  },
  destination: {
    label: "Customer destination",
    address: "House 24, Street 310, BKK1, Phnom Penh",
    coordinates: { latitude: 11.54822, longitude: 104.92586 },
  },
  customer: {
    name: "Sreyneang Lim",
    phone: "+855 96 812 3476",
  },
  items: [
    { name: "Morning glory", quantity: 2, unit: "bunches" },
    { name: "Tomatoes", quantity: 1, unit: "kg" },
    { name: "Winter melon", quantity: 1, unit: "piece" },
  ],
  note: "Green gate beside the coffee shop. Please call when you arrive.",
};

export const DEMO_HISTORY: DeliveryHistoryItem[] = [
  {
    id: "DLV-2036",
    status: "completed",
    receivedAt: "2026-08-12T15:10:00+07:00",
    acceptedAt: "2026-08-12T15:13:00+07:00",
    arrivedAt: "2026-08-12T15:41:00+07:00",
    completedAt: "2026-08-12T15:43:00+07:00",
    distanceKm: 3.2,
    estimatedMinutes: 14,
    pickup: {
      label: "Dara Fresh Market",
      address: "Russian Market, Toul Tom Poung, Phnom Penh",
      coordinates: { latitude: 11.54031, longitude: 104.91421 },
    },
    destination: {
      label: "Customer destination",
      address: "Street 163, Sangkat Olympic, Phnom Penh",
      coordinates: { latitude: 11.54996, longitude: 104.91116 },
    },
    customer: { name: "Piseth Vann", phone: "+855 17 771 209" },
    items: [
      { name: "Cucumbers", quantity: 2, unit: "kg" },
      { name: "Basil", quantity: 1, unit: "bunch" },
    ],
  },
  {
    id: "DLV-2029",
    status: "completed",
    receivedAt: "2026-08-11T10:05:00+07:00",
    acceptedAt: "2026-08-11T10:07:00+07:00",
    arrivedAt: "2026-08-11T10:36:00+07:00",
    completedAt: "2026-08-11T10:38:00+07:00",
    distanceKm: 5.1,
    estimatedMinutes: 22,
    pickup: {
      label: "Sovann Organic Farm",
      address: "Chroy Changvar, Phnom Penh",
      coordinates: { latitude: 11.58784, longitude: 104.9408 },
    },
    destination: {
      label: "Customer destination",
      address: "Street 214, Daun Penh, Phnom Penh",
      coordinates: { latitude: 11.56286, longitude: 104.91873 },
    },
    customer: { name: "Maly Ros", phone: "+855 10 441 903" },
    items: [{ name: "Mixed vegetable basket", quantity: 1, unit: "basket" }],
    note: "Reception desk can receive the order.",
  },
];

export const DEMO_NOTIFICATION: DeliveryNotification = {
  id: "notification-demo-01",
  deliveryId: DEMO_INCOMING_DELIVERY.id,
  title: "New delivery request",
  message: "Green Basket Farm → BKK1, Phnom Penh",
  createdAt: DEMO_INCOMING_DELIVERY.receivedAt,
  read: false,
};

export function createInitialDemoState(): DemoDeliveryState {
  return {
    user: null,
    incoming: [{ ...DEMO_INCOMING_DELIVERY }],
    current: null,
    history: DEMO_HISTORY.map((item) => ({ ...item })),
    notifications: [{ ...DEMO_NOTIFICATION }],
    activationEmail: "",
    password: DEMO_AUTH.password,
  };
}
