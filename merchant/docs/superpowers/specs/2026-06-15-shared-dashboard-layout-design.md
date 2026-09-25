# Shared Merchant Dashboard Layout Design

## Goal

Render the merchant header once for all dashboard pages, remove the unused Menu route, and centralize merchant identity and low-stock data.

## Route Structure

Create an App Router route group at `app/(dashboard)`. Move the active merchant pages into that group:

- `app/(dashboard)/home/page.tsx`
- `app/(dashboard)/product/page.tsx`
- `app/(dashboard)/order/page.tsx`
- `app/(dashboard)/profile/page.tsx`

The route group does not change public URLs. `/home`, `/product`, `/order`, and `/profile` remain the same. Authentication pages remain under `app/auth` and do not render the dashboard header.

Delete `app/menu/page.tsx` and remove Menu from desktop and mobile navigation.

## Shared Shell

Add `app/(dashboard)/layout.tsx` as a client dashboard shell. It renders `Header` once, loads the signed-in merchant's name and profile photo from `profile_merchants`, and loads low-stock products from `products`.

The shell provides merchant identity through a small React context. Profile can update the context immediately after account changes so the shared header updates without a full page reload.

## Page Responsibilities

Dashboard pages render only their page content. They no longer import or render Header and no longer query merchant name or profile photo independently.

The Product and Home pages retain their own product queries because those queries serve page content. Shared low-stock alerts are owned by the layout and refreshed when the dashboard mounts.

## Compatibility

Keep the older duplicate `/` and `/orders` routes unchanged during this focused change. They are not part of the active navigation and can be removed in a separate cleanup.

## Verification

Verify that Menu no longer appears or resolves, active dashboard URLs remain unchanged, Header is rendered only by the dashboard layout, profile updates refresh shared identity, TypeScript passes, focused lint passes, and the production build succeeds.
