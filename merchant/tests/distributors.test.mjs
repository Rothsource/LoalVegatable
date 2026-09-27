import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  distributorMatchesSearch,
  mapDistributorRow,
  normalizeDistributorStatus,
  validateDistributorForm,
} from "../lib/distributors.ts";

test("normalizes distributor status correctly", () => {
  assert.equal(normalizeDistributorStatus("Active"), "Active");
  assert.equal(normalizeDistributorStatus("active"), "Active");
  assert.equal(normalizeDistributorStatus("Inactive"), "Inactive");
  assert.equal(normalizeDistributorStatus("inactive"), "Inactive");
  assert.equal(normalizeDistributorStatus(null), "Active");
  assert.equal(normalizeDistributorStatus(undefined), "Active");
});

test("maps Supabase distributor row to frontend Distributor model", () => {
  const row = {
    id: "dist-123",
    merchant_id: "merch-456",
    full_name: "Sok Dara",
    email: "sokdara@gmail.com",
    phone: "+85512345678",
    delivery_area: "Phnom Penh - Chamkarmon",
    status: "Active",
    created_at: "2026-08-01T00:00:00Z",
  };

  const mapped = mapDistributorRow(row);
  assert.equal(mapped.id, "dist-123");
  assert.equal(mapped.merchantId, "merch-456");
  assert.equal(mapped.name, "Sok Dara");
  assert.equal(mapped.email, "sokdara@gmail.com");
  assert.equal(mapped.phone, "+85512345678");
  assert.equal(mapped.deliveryArea, "Phnom Penh - Chamkarmon");
  assert.equal(mapped.status, "Active");
  assert.equal(mapped.createdAt, "2026-08-01T00:00:00Z");
});

test("validates distributor forms for required fields and password rules", () => {
  // Empty name
  assert.equal(
    validateDistributorForm({ name: "", email: "dist@gmail.com", password: "password123" }),
    "Distributor name is required."
  );

  // Missing email
  assert.equal(
    validateDistributorForm({ name: "Distributor One", email: "", password: "password123" }),
    "Email address is required."
  );

  // Invalid email format
  assert.equal(
    validateDistributorForm({ name: "Distributor One", email: "notanemail", password: "password123" }),
    "Enter a valid email address."
  );

  // Missing required temporary password on creation
  assert.equal(
    validateDistributorForm(
      { name: "Distributor One", email: "dist@gmail.com", password: "" },
      { requirePassword: true }
    ),
    "A temporary password is required."
  );

  // Short password
  assert.equal(
    validateDistributorForm({ name: "Distributor One", email: "dist@gmail.com", password: "123" }),
    "Temporary password must be at least 8 characters."
  );

  // Valid form
  assert.equal(
    validateDistributorForm(
      { name: "Distributor One", email: "dist@gmail.com", password: "strongpassword" },
      { requirePassword: true }
    ),
    null
  );
});

test("filters distributors by query matches across name, email, phone, and area", () => {
  const distributor = {
    id: "dist-1",
    merchantId: "merch-1",
    name: "Chanthy Delivery",
    email: "chanthy.express@gmail.com",
    phone: "012888999",
    deliveryArea: "Toul Kork, Phnom Penh",
    status: "Active",
    createdAt: "2026-08-01T00:00:00Z",
  };

  assert.ok(distributorMatchesSearch(distributor, "chanthy"));
  assert.ok(distributorMatchesSearch(distributor, "GMAIL.COM"));
  assert.ok(distributorMatchesSearch(distributor, "888"));
  assert.ok(distributorMatchesSearch(distributor, "Toul Kork"));
  assert.ok(!distributorMatchesSearch(distributor, "Siem Reap"));
});

test("distributor APIs scope records to the authenticated merchant", async () => {
  const collectionRoute = await readFile(
    new URL("../app/api/merchant/distributors/route.ts", import.meta.url),
    "utf8"
  );
  const itemRoute = await readFile(
    new URL("../app/api/merchant/distributors/[id]/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(collectionRoute, /\.eq\("merchant_id", auth\.user\.id\)/);
  assert.match(itemRoute, /\.eq\("merchant_id", merchantId\)/);
  assert.match(itemRoute, /updateUserById/);
  assert.match(itemRoute, /deleteUser/);
  assert.match(itemRoute, /ban_duration/);
});

test("merchant navigation and compatibility route open the canonical distributor page", async () => {
  const [header, compatibilityPage, authHelper] = await Promise.all([
    readFile(new URL("../components/Header.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/(dashboard)/distributors/page.tsx", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../lib/supabaseAdmin.ts", import.meta.url), "utf8"),
  ]);

  assert.match(header, /href: "\/distributor"/);
  assert.match(compatibilityPage, /redirect\("\/distributor"\)/);
  assert.match(authHelper, /getRequestMerchant/);
  assert.match(authHelper, /Only merchant accounts can manage distributors/);
});
