export default function AdminPage() {
  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p className="mt-2 text-gray-600">Overview of your admin portal.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <a
          href="/merchants"
          className="rounded-2xl bg-white p-6 shadow hover:shadow-lg"
        >
          <div className="text-4xl">🏪</div>
          <h3 className="mt-4 text-xl font-bold text-gray-900">Merchants</h3>
          <p className="mt-2 text-gray-600">
            View, approve, decline, and manage merchants.
          </p>
        </a>

        <a
          href="/users"
          className="rounded-2xl bg-white p-6 shadow hover:shadow-lg"
        >
          <div className="text-4xl">👥</div>
          <h3 className="mt-4 text-xl font-bold text-gray-900">Users</h3>
          <p className="mt-2 text-gray-600">
            View and manage platform users.
          </p>
        </a>

        <a
          href="/products"
          className="rounded-2xl bg-white p-6 shadow hover:shadow-lg"
        >
          <div className="text-4xl">📦</div>
          <h3 className="mt-4 text-xl font-bold text-gray-900">Products</h3>
          <p className="mt-2 text-gray-600">
            View and manage product information.
          </p>
        </a>
      </div>
    </>
  );
}