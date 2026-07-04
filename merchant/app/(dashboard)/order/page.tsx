import Link from "next/link";

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6">
      <div>
        <h1 className="text-xl font-black text-gray-900">Orders</h1>
        <p className="mt-0.5 text-sm text-gray-400">0 total · 0 pending</p>
      </div>

      <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
          <svg
            className="h-7 w-7 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9 5h6m-6 4h6m-6 4h4m-6 8h10a2 2 0 002-2V7a2 2 0 00-2-2h-1a2 2 0 00-2-2h-4a2 2 0 00-2 2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="mt-5 text-lg font-black text-gray-800">No orders yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          Real customer orders will appear here after customer checkout is
          connected to the merchant orders backend.
        </p>
        <Link
          href="/product"
          className="mt-6 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
        >
          Manage products
        </Link>
      </section>
    </main>
  );
}
