import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deliveryActionLabel,
  nextDeliveryStatus,
  normalizeDeliveryStatus,
} from "../lib/delivery.ts";

test("normalizes and advances the required distributor order statuses", () => {
  assert.equal(normalizeDeliveryStatus("packaging"), "Packaging");
  assert.equal(normalizeDeliveryStatus("DELIVERING"), "Delivering");
  assert.equal(normalizeDeliveryStatus("unknown"), "Pending");
  assert.equal(nextDeliveryStatus("Pending"), "Confirmed");
  assert.equal(nextDeliveryStatus("Preparing"), "Packaging");
  assert.equal(nextDeliveryStatus("Packaging"), "Delivering");
  assert.equal(nextDeliveryStatus("Delivered"), null);
  assert.equal(deliveryActionLabel("Pending"), "Confirm order");
});

test("distributor portal scopes products and order updates to the signed-in distributor", async () => {
  const [products, orders, middleware, login, reset, setup] = await Promise.all([
    readFile(new URL("../app/(distributor)/delivery/products/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(distributor)/delivery/orders/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/auth/LoginForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth/reset-password/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auth/distributor-setup/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(products, /profile_distributors/);
  assert.match(products, /\.eq\("merchant_id", profileResult\.data\.merchant_id\)/);
  assert.match(products, /\.eq\("is_active", true\)/);
  assert.match(orders, /\.eq\("distributor_id", user\.id\)/);
  assert.match(orders, /\.eq\("distributor_id", userData\.user\.id\)/);
  assert.match(middleware, /role === "distributor"/);
  assert.match(middleware, /pathname\.startsWith\("\/delivery"\)/);
  assert.match(login, /must_change_password/);
  assert.match(reset, /must_change_password: false/);
  assert.match(setup, /signInWithOtp/);
  assert.match(setup, /verifyOtp/);
  assert.match(setup, /type: "email"/);
  assert.match(setup, /must_change_password: false/);
});

test("distributor form is mounted only while open so a reopened form starts clean", async () => {
  const page = await readFile(
    new URL("../app/(dashboard)/distributor/page.tsx", import.meta.url),
    "utf8"
  );
  assert.match(page, /\{formOpen && \(\s*<DistributorFormModal/);
});
