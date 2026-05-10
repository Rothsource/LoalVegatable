export default function AdminPage() {
  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p className="mt-2 text-gray-600">Overview of your admin portal.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-gray-500">Total Users</h3>
          <p className="mt-3 text-3xl font-bold text-gray-900">12</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-gray-500">Projects</h3>
          <p className="mt-3 text-3xl font-bold text-gray-900">5</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-gray-500">System Status</h3>
          <p className="mt-3 text-3xl font-bold text-green-600">Active</p>
        </div>
      </div>
    </>
  );
}