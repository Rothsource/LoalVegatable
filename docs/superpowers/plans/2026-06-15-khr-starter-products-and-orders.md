# KHR Starter Products and Honest Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ten authenticated Supabase starter vegetables with KHR pricing and remove stale demo orders from the active merchant order page.

**Architecture:** Pure helpers own KHR formatting and starter product definitions so they can be tested without React or Supabase. Normal product loading reads the merchant catalog without reseeding it. Removing products archives them through `is_active`, with an Archived filter and restore action. The order page becomes an honest empty state because no orders backend exists.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, Node test runner, ESLint

---

### Task 1: Add testable KHR and starter-product helpers

**Files:**
- Create: `merchant/lib/currency.ts`
- Create: `merchant/lib/starterProducts.ts`
- Create: `merchant/tests/starterProducts.test.mjs`

- [ ] Write tests asserting KHR formatting, ten unique starter slugs, positive whole-number prices, and merchant payload mapping.
- [ ] Run the Node test runner and confirm failure because the helper modules do not exist.
- [ ] Add the minimal formatter, starter definitions, and payload builder.
- [ ] Re-run the tests and confirm all assertions pass.

### Task 2: Seed and display the product catalog

**Files:**
- Modify: `merchant/app/(dashboard)/product/page.tsx`
- Modify: `merchant/components/products/ProductCard.tsx`
- Modify: `merchant/components/products/ProductModal.tsx`

- [ ] Fetch the authenticated merchant's product list without recreating missing starter products.
- [ ] Archive removed products with `is_active: false` and provide an Archived filter with restore.
- [ ] Display card prices with the shared KHR formatter.
- [ ] Label the product form price as KHR and restrict it to whole riel values.
- [ ] Run focused TypeScript and ESLint checks.

### Task 3: Remove fabricated order data

**Files:**
- Modify: `merchant/app/(dashboard)/order/page.tsx`

- [ ] Replace demo order state, product images, USD totals, status actions, and modals with a concise empty state.
- [ ] Explain that orders will appear after customer checkout is connected.
- [ ] Assert the active order page contains no `INITIAL_ORDERS`, demo product names, or dollar formatting.

### Task 4: Verify integration

**Files:**
- Verify: `merchant/app/(dashboard)/product/page.tsx`
- Verify: `merchant/app/(dashboard)/order/page.tsx`

- [ ] Run helper tests.
- [ ] Generate Next.js route types and run TypeScript.
- [ ] Run focused ESLint on all changed source files.
- [ ] Run the production build and confirm `/product` and `/order` are generated.
