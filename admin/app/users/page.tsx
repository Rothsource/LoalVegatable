"use client";

import AdminLayout from "../components/AdminLayout";

export default function UsersPage() {
  return (
    <AdminLayout title="Users">
      <h2 className="text-3xl font-bold text-gray-900">Users</h2>
      <p className="mt-2 text-gray-600">Manage your users here.</p>
    </AdminLayout>
  );
}