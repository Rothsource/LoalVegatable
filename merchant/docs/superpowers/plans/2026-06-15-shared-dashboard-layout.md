# Shared Merchant Dashboard Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render one shared merchant header for active dashboard pages and remove the unused Menu route.

**Architecture:** Move active dashboard pages into a URL-preserving App Router route group. Add a client dashboard layout that loads shared merchant identity and low-stock alerts, renders Header once, and exposes identity updates through context.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase

---

### Task 1: Prove the current duplication

**Files:**
- Verify: `merchant/app/home/page.tsx`
- Verify: `merchant/app/product/page.tsx`
- Verify: `merchant/app/order/page.tsx`
- Verify: `merchant/app/profile/page.tsx`
- Verify: `merchant/app/menu/page.tsx`

- [ ] **Step 1: Run failing architecture assertions**

Require a dashboard route-group layout, no active-page Header imports, no Menu navigation entry, and no Menu page.

Expected: FAIL because each active page renders Header and Menu exists.

### Task 2: Add shared dashboard identity context

**Files:**
- Create: `merchant/components/DashboardShell.tsx`
- Create: `merchant/lib/dashboardContext.ts`

- [ ] **Step 1: Add context contract**

Expose `merchantName`, `profileUrl`, and `updateMerchantIdentity`.

- [ ] **Step 2: Add dashboard shell**

Load the signed-in merchant from `profile_merchants`, load low-stock products, render Header once, and provide the identity context around page children.

### Task 3: Create the protected route-group layout

**Files:**
- Create: `merchant/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Render DashboardShell**

Wrap route-group children in the shared shell without changing URLs.

### Task 4: Move active pages and remove repeated header code

**Files:**
- Move: `merchant/app/home/page.tsx` to `merchant/app/(dashboard)/home/page.tsx`
- Move: `merchant/app/product/page.tsx` to `merchant/app/(dashboard)/product/page.tsx`
- Move: `merchant/app/order/page.tsx` to `merchant/app/(dashboard)/order/page.tsx`
- Move: `merchant/app/profile/page.tsx` to `merchant/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Move the files**

Use URL-preserving App Router route-group paths.

- [ ] **Step 2: Remove Header imports and elements**

Remove repeated Header rendering and merchant identity fetches from Home, Product, and Order.

- [ ] **Step 3: Connect Profile to context**

Use `updateMerchantIdentity` after profile loading, local photo selection/removal, and successful account save so Header updates immediately.

### Task 5: Remove Menu

**Files:**
- Delete: `merchant/app/menu/page.tsx`
- Modify: `merchant/components/Header.tsx`

- [ ] **Step 1: Remove Menu icon and navigation item**

Desktop and mobile navigation should contain Home, Product, Order, and Profile only.

- [ ] **Step 2: Change mobile navigation columns**

Use four columns instead of five.

### Task 6: Verify the architecture

**Files:**
- Verify all moved and created merchant files

- [ ] **Step 1: Re-run architecture assertions**

Expected: PASS.

- [ ] **Step 2: Regenerate route types and run TypeScript**

Run `next typegen` followed by `tsc --noEmit`.

- [ ] **Step 3: Run focused lint**

Lint the shared shell, context, Header, route-group layout, and Profile page.

- [ ] **Step 4: Run production build**

Confirm `/home`, `/product`, `/order`, and `/profile` still exist and `/menu` is gone.

- [ ] **Step 5: Inspect merchant-only diff**

Do not commit while the repository remains in its existing unfinished merge.
