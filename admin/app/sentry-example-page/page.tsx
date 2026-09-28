"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [eventId, setEventId] = useState<string | null>(null);
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  function sendTestEvents() {
    Sentry.logger.info("User triggered test log", { log_source: "sentry_test" });
    setEventId(Sentry.captureException(new Error("Admin Sentry test error")) ?? null);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold">Sentry setup check</h1>
      <p className="mt-3 text-sm text-gray-600">
        Send one test error and one structured log to the admin Sentry project.
      </p>
      <button
        className="mt-6 w-fit rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!isConfigured}
        onClick={sendTestEvents}
        type="button"
      >
        Send test events
      </button>
      {!isConfigured && (
        <p className="mt-4 text-sm text-red-700">
          Sentry is not configured. Add NEXT_PUBLIC_SENTRY_DSN and redeploy.
        </p>
      )}
      {eventId && (
        <p className="mt-4 text-sm text-green-800">
          Test error sent. Check the Sentry Issues and Logs views.
        </p>
      )}
    </main>
  );
}