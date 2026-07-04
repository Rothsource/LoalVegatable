import assert from "node:assert/strict";
import test from "node:test";

import { formatKHR } from "../lib/currency.ts";
import {
  STARTER_PRODUCTS,
  buildStarterProductRows,
} from "../lib/starterProducts.ts";

test("formats whole-number Khmer riel prices", () => {
  assert.equal(formatKHR(4000), "៛ 4,000");
  assert.equal(formatKHR(12500), "៛ 12,500");
});

test("defines ten starter vegetables with unique stable slugs", () => {
  assert.equal(STARTER_PRODUCTS.length, 10);
  assert.equal(new Set(STARTER_PRODUCTS.map((product) => product.slug)).size, 10);
  assert.ok(
    STARTER_PRODUCTS.every((product) => product.slug.startsWith("starter-kh-"))
  );
});

test("uses positive whole-number KHR prices and vegetable images", () => {
  assert.ok(
    STARTER_PRODUCTS.every(
      (product) =>
        Number.isInteger(product.price) &&
        product.price > 0 &&
        product.profilePicUrl.startsWith("https://")
    )
  );
});

test("builds Supabase rows for the signed-in merchant", () => {
  const rows = buildStarterProductRows("merchant-123", new Date("2026-06-15"));
  const otherMerchantRows = buildStarterProductRows(
    "merchant-456",
    new Date("2026-06-15")
  );

  assert.equal(rows.length, 10);
  assert.ok(rows.every((row) => row.merchant_id === "merchant-123"));
  assert.ok(rows.every((row) => row.slug.endsWith("-merchant-123")));
  assert.notDeepEqual(
    rows.map((row) => row.slug),
    otherMerchantRows.map((row) => row.slug)
  );
  assert.ok(rows.every((row) => row.is_active));
  assert.ok(rows.every((row) => row.harvest_date === "2026-06-15"));
});
