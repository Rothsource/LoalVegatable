# Merchant Info Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unreadable merchant onboarding fields and unclear native file inputs with a minimal professional form and compact upload controls.

**Architecture:** Keep form state and Supabase submission in `app/auth/merchant-info/page.tsx`. Add a small page-local upload-card component that triggers hidden file inputs, displays local selections, and delegates validated files to the existing submit flow.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Supabase.

---

### Task 1: Confirm The Current UI Gap

**Files:**
- Inspect: `app/auth/merchant-info/page.tsx`

- [ ] **Step 1: Run the failing source check**

```powershell
$source = Get-Content app/auth/merchant-info/page.tsx -Raw
if ($source -notmatch 'Choose file' -or $source -notmatch 'text-gray-900') { exit 1 }
```

Expected: FAIL because the page uses visible native file inputs and does not explicitly set dark input text.

### Task 2: Implement Readable Fields And Upload Cards

**Files:**
- Modify: `app/auth/merchant-info/page.tsx`

- [ ] **Step 1: Add explicit field styling**

Use a shared class containing:

```ts
"bg-white text-gray-900 placeholder:text-gray-400"
```

- [ ] **Step 2: Add page-local upload controls**

Create an `UploadField` with a hidden input, visible choose/change button, compact selected file list, small previews, and remove controls.

- [ ] **Step 3: Validate selected files**

Reject oversized or unsupported files before storing them in component state.

- [ ] **Step 4: Preserve submission behavior**

Continue uploading selected files to `products-images`, upserting `profile_merchants`, setting `is_approved: false`, and redirecting to `/auth/pending`.

### Task 3: Verify

**Files:**
- Verify: `app/auth/merchant-info/page.tsx`

- [ ] **Step 1: Re-run the source check**

```powershell
$source = Get-Content app/auth/merchant-info/page.tsx -Raw
if ($source -notmatch 'Choose file' -or $source -notmatch 'text-gray-900') { exit 1 }
```

Expected: PASS.

- [ ] **Step 2: Run focused lint**

```powershell
npm.cmd exec eslint app/auth/merchant-info/page.tsx
```

Expected: PASS.

- [ ] **Step 3: Run the production build**

```powershell
npm.cmd run build
```

Expected: successful Next.js production build.
