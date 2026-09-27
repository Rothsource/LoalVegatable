import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import CustomerShell from "@/components/CustomerShell";

export const metadata: Metadata = {
  title: "LocalVegetable — Farm Fresh, Delivered",
  description:
    "Discover seasonal vegetables sourced directly from local farmers. Fresh, organic, and delivered to your door.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CustomerShell>{children}</CustomerShell>
      </body>
    </html>
  );
}