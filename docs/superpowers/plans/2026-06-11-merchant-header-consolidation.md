# Merchant Header Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all merchant dashboard routes onto one stable, functional shared header.

**Architecture:** `components/Header.tsx` owns route-aware navigation, account actions, notifications, and responsive layout. Dashboard pages pass only merchant identity and low-stock data, while legacy header implementations are removed after all consumers migrate.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Supabase SSR.

---

### Task 1: Establish The Shared Header Contract

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: Run the failing source check**

```powershell
$matches = rg -n "MerchantHeader|components/Navbar|<header className=\"sticky" app components --glob "!components/Header.tsx"
if ($matches) { $matches; exit 1 }
```

Expected: FAIL because legacy header imports and inline header markup still exist.

- [ ] **Step 2: Refactor the header API**

Use this page-facing contract:

```ts
type LowStockItem = { id?: string | number; name: string; stock: number };

interface HeaderProps {
  lowStock?: LowStockItem[];
  merchantName?: string;
}
```

Use `usePathname()` inside the component instead of an `activePath` prop.

- [ ] **Step 3: Stabilize desktop and mobile layout**

Implement:

```tsx
<div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
```

Use fixed-width desktop navigation items, always render the notification slot, remove `LowStockBanner`, and keep only the compact mobile navigation strip.

- [ ] **Step 4: Make account actions functional**

Import the shared browser Supabase client and implement sign-out:

```ts
async function handleSignOut() {
  const { error } = await supabase.auth.signOut();
  if (!error) window.location.href = "/auth/login";
}
```

Keep only the existing `/profile` account link.

- [ ] **Step 5: Run header-focused lint**

Run:

```powershell
npm.cmd exec eslint components/Header.tsx
```

Expected: PASS with no errors.

### Task 2: Migrate New Merchant Routes

**Files:**
- Modify: `app/home/page.tsx`
- Modify: `app/product/page.tsx`
- Modify: `app/order/page.tsx`
- Modify: `app/menu/page.tsx`

- [ ] **Step 1: Remove manual active-path props**

Use:

```tsx
<Header lowStock={lowStock} merchantName={merchantName} />
```

- [ ] **Step 2: Add the shared header to Menu**

Use the standard route shell:

```tsx
<div className="min-h-screen bg-[#f5f9f3] text-gray-900">
  <Header merchantName="Merchant" />
  <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
    <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
    <p className="text-gray-500">Coming soon.</p>
  </main>
</div>
```

- [ ] **Step 3: Run route-focused lint**

Run:

```powershell
npm.cmd exec eslint app/home/page.tsx app/product/page.tsx app/order/page.tsx app/menu/page.tsx
```

Expected: no header-related errors. Existing unrelated route lint findings must be reported separately.

### Task 3: Migrate Legacy Merchant Routes

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/products/page.tsx`
- Modify: `app/orders/page.tsx`
- Modify: `app/profile/page.tsx`

- [ ] **Step 1: Replace inline and legacy headers**

Import:

```ts
import Header from "@/components/Header";
```

Replace each `MerchantHeader` or inline header with the shared `Header`, preserving existing low-stock props where available.

- [ ] **Step 2: Keep page content behavior unchanged**

Do not alter product, order, profile, or API logic as part of header consolidation.

- [ ] **Step 3: Re-run the source check**

```powershell
$matches = rg -n "MerchantHeader|components/Navbar|<header className=\"sticky" app components --glob "!components/Header.tsx" --glob "!components/MerchantHeader.tsx" --glob "!components/Navbar.tsx"
if ($matches) { $matches; exit 1 }
```

Expected: PASS with no output.

### Task 4: Remove Retired Header Components And Verify

**Files:**
- Delete: `components/MerchantHeader.tsx`
- Delete: `components/Navbar.tsx`

- [ ] **Step 1: Remove retired components**

Delete both files only after source checks show no remaining imports.

- [ ] **Step 2: Verify merchant-only scope**

Run:

```powershell
git diff --name-only -- merchant
git diff --name-only -- customer admin
```

Expected: this task adds no new customer or admin edits.

- [ ] **Step 3: Run focused lint**

Run:

```powershell
npm.cmd exec eslint components/Header.tsx app/menu/page.tsx
```

Expected: PASS with no errors.

- [ ] **Step 4: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected: successful Next.js production build.
