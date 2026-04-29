import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}