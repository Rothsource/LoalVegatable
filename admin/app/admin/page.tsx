"use client";

import AdminLayout from "../components/AdminLayout";

export default function AdminPage() {
  return (
    <AdminLayout title="Dashboard">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
      <p className="mt-2 text-gray-600">Overview of your admin portal.</p>
    </AdminLayout>
  );
}