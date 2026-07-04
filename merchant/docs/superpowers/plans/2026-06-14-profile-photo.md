# Merchant Profile Photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend-persisted merchant profile photo and display it throughout the shared merchant header.

**Architecture:** Keep upload selection and preview on the Profile page, upload the file to the existing Supabase bucket when the account form is submitted, and persist the public URL through the account API. Extend the shared Header with an optional profile URL and use the initial as a fallback.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase Auth, Database, and Storage

---

### Task 1: Add reusable image validation

**Files:**
- Create: `merchant/lib/profilePhoto.ts`
- Test: source assertions and TypeScript

- [ ] **Step 1: Write a failing source assertion**

Assert that `validateProfilePhoto` is exported and accepts JPEG, PNG, and WebP files no larger than 5 MB.

- [ ] **Step 2: Run the assertion**

Expected: FAIL because `merchant/lib/profilePhoto.ts` does not exist.

- [ ] **Step 3: Implement validation constants and helper**

Return an empty string for a valid file and a user-facing error for unsupported types or oversized files.

- [ ] **Step 4: Re-run the assertion**

Expected: PASS.

### Task 2: Persist profile URLs through the account API

**Files:**
- Modify: `merchant/app/api/merchant/account/route.ts`

- [ ] **Step 1: Write a failing source assertion**

Assert that the request body accepts `profileUrl`, auth metadata writes `profile_url`, and the profile table upsert writes `profile_url`.

- [ ] **Step 2: Run the assertion**

Expected: FAIL because the API does not currently persist the URL.

- [ ] **Step 3: Add `profileUrl` handling**

Normalize the value and include it in both persistence targets without changing existing account validation.

- [ ] **Step 4: Re-run the assertion**

Expected: PASS.

### Task 3: Add Profile page upload controls

**Files:**
- Modify: `merchant/app/profile/page.tsx`

- [ ] **Step 1: Write a failing source assertion**

Assert that the page loads `profile_url`, renders a file input, validates the selected file, uploads to `merchants/{userId}/profile`, and sends `profileUrl` in the account request.

- [ ] **Step 2: Run the assertion**

Expected: FAIL because the page has no photo controls.

- [ ] **Step 3: Implement profile photo state and loading**

Load the profile table record first, fall back to auth metadata, and preserve the current saved URL.

- [ ] **Step 4: Implement selection, preview, remove, and upload**

Preview valid files locally. On submit, upload a selected file to `products-images`, or send an empty URL when removal was requested.

- [ ] **Step 5: Add accessible UI**

Show a circular preview, choose/change button, remove button, validation text, and saving/uploading state.

- [ ] **Step 6: Re-run the assertion**

Expected: PASS.

### Task 4: Display the photo in the shared header

**Files:**
- Modify: `merchant/components/Header.tsx`
- Modify: `merchant/app/home/page.tsx`
- Modify: `merchant/app/product/page.tsx`
- Modify: `merchant/app/order/page.tsx`
- Modify: `merchant/app/profile/page.tsx`

- [ ] **Step 1: Write a failing source assertion**

Assert that Header accepts `profileUrl`, displays it in the account trigger and menu, and each Supabase-backed page passes the loaded `profile_url`.

- [ ] **Step 2: Run the assertion**

Expected: FAIL because Header only renders initials.

- [ ] **Step 3: Add the shared avatar renderer**

Render a cropped circular image when a URL is available and use the initial fallback if it is absent or fails.

- [ ] **Step 4: Load and pass profile URLs**

Extend existing merchant profile selects on Home, Product, and Order to include `profile_url`. Pass Profile page state directly.

- [ ] **Step 5: Re-run the assertion**

Expected: PASS.

### Task 5: Verify merchant-only behavior

**Files:**
- Verify all modified merchant files

- [ ] **Step 1: Regenerate Next route types**

Run: `merchant\node_modules\.bin\next.cmd typegen`

Expected: exit code 0.

- [ ] **Step 2: Run TypeScript**

Run: `merchant\node_modules\.bin\tsc.cmd --noEmit`

Expected: exit code 0.

- [ ] **Step 3: Run targeted lint**

Lint the modified source files and report any pre-existing rule failures separately from profile-photo issues.

- [ ] **Step 4: Inspect the diff**

Confirm that changes are merchant-only and do not alter unresolved customer merge files. Do not commit while the existing merge is unfinished.
