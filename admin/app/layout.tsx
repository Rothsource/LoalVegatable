import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalVegetable | Admin Control Center",
  description: "Administrative console and ecosystem management for LocalVegetable agricultural marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">{children}</body>
    </html>
  );
}
