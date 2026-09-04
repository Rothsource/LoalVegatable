# Archived Product Permanent Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let merchants permanently delete an archived product after an explicit irreversible confirmation.

**Architecture:** Product cards expose permanent deletion only when `active` is false. The product page owns the selected target and Supabase delete operation. A dedicated confirmation modal keeps archive and permanent-delete language unambiguous.

**Tech Stack:** React, TypeScript, Supabase, Node test runner, ESLint

---

### Task 1: Add the archived-only delete flow

**Files:**
- Create: `merchant/components/products/PermanentDeleteProductModal.tsx`
- Modify: `merchant/components/products/ProductCard.tsx`
- Modify: `merchant/app/(dashboard)/product/page.tsx`
- Test: `merchant/tests/productDeletion.test.mjs`

- [ ] Add a failing source assertion requiring an archived-only delete callback, permanent-delete modal, and Supabase `.delete()`.
- [ ] Run the test and confirm it fails because permanent deletion is absent.
- [ ] Add the archived card action and dedicated confirmation modal.
- [ ] Delete the confirmed row from Supabase and local state.
- [ ] Run tests, TypeScript, focused ESLint, and the production build.
