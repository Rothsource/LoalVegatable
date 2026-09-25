import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the product page does not recreate deleted starter products", async () => {
  const source = await readFile(
    new URL("../app/(dashboard)/product/page.tsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /buildStarterProductRows/);
  assert.doesNotMatch(source, /missingStarters/);
  assert.doesNotMatch(source, /Added \$\{missingStarters\.length\} starter product/);
  assert.doesNotMatch(source, /\.from\("products"\)\.delete\(\)/);
  assert.match(source, /\.update\(\{ is_active: false \}\)/);
  assert.match(source, /Archived/);
  assert.match(source, /Restore/);
  assert.match(source, /permanentDeleteTarget/);
  assert.match(
    source,
    /\.from\("products"\)\s*\.delete\(\)\s*\.eq\("id"/
  );
  assert.match(source, /PermanentDeleteProductModal/);
});
