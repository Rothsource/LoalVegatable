# Remove Legacy Products Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the browser-only `/products` page and make all live merchant product links open the Supabase-backed `/product` page.

**Architecture:** Keep `app/product/page.tsx` as the single merchant product-management route. Delete the isolated local-storage page and helper, then update the legacy dashboard links without changing the Supabase product implementation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase

---

### Task 1: Prove the legacy route is still reachable

**Files:**
- Test: merchant route/file assertions

- [ ] **Step 1: Run the failing assertions**

Run a workspace assertion that requires no live `/products` links, no `app/products/page.tsx`, and no `lib/merchantProducts.ts`.

Expected: FAIL because all three legacy artifacts still exist.

### Task 2: Remove the legacy implementation

**Files:**
- Modify: `merchant/app/page.tsx`
- Delete: `merchant/app/products/page.tsx`
- Delete: `merchant/lib/merchantProducts.ts`

- [ ] **Step 1: Repoint dashboard links**

Replace each `href="/products"` in `merchant/app/page.tsx` with `href="/product"`.

- [ ] **Step 2: Delete browser-only product files**

Delete the obsolete page and its local-storage-only helper.

### Task 3: Verify the cleanup

**Files:**
- Verify: `merchant/app/page.tsx`
- Verify: `merchant/app/product/page.tsx`

- [ ] **Step 1: Re-run route/file assertions**

Expected: PASS with no live `/products` links and both obsolete files absent.

- [ ] **Step 2: Run TypeScript**

Run: `merchant\node_modules\.bin\tsc.cmd --noEmit`

Expected: exit code 0.

- [ ] **Step 3: Inspect merchant-only diff**

Confirm the diff contains only the planned merchant route cleanup and this plan document. Do not commit while the repository remains in an unfinished merge.
