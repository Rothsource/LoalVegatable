import type { Metadata, Viewport } from "next";
import { DeliveryProvider } from "@/context/DeliveryProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Vegetable Delivery",
  description: "A focused delivery workspace for Local Vegetable riders.",
  icons: {
    icon: "/image/logo.png",
    shortcut: "/image/logo.png",
    apple: "/image/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e6f40",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DeliveryProvider>{children}</DeliveryProvider>
      </body>
    </html>
  );
}
