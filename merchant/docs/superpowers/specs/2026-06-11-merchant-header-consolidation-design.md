# Merchant Header Consolidation Design

## Goal

Give every merchant dashboard route the same stable header, navigation, account controls, and responsive behavior while keeping the new Supabase-backed route family as the primary application.

## Scope

This change is limited to `merchant`.

Primary routes:

- `/home`
- `/product`
- `/order`
- `/menu`
- `/profile`

Legacy `/`, `/products`, and `/orders` pages may remain reachable during the current merge, but they must use the same shared header so navigation does not visibly change between routes.

## Component Design

`components/Header.tsx` becomes the only merchant dashboard header.

It will:

- derive the active navigation state from `usePathname()`;
- use a three-column grid so the logo, centered navigation, and actions do not move when content widths change;
- reserve a fixed notification-button slot even when there are no alerts;
- show low-stock information only in the notification dropdown, not in a layout-changing banner;
- display the merchant name and avatar initial supplied by each page;
- link only to existing routes;
- sign out through Supabase and redirect to `/auth/login`;
- use one mobile navigation strip without a second full-screen hamburger menu.

## Page Integration

The new `/home`, `/product`, and `/order` pages keep their existing Supabase queries and pass live merchant and stock data into `Header`.

`/menu` will receive the shared header and a standard page wrapper even though its content is still a placeholder.

`/profile`, `/products`, `/orders`, and `/` will switch from `MerchantHeader` or inline markup to `Header`. Their existing page content and data behavior will remain unchanged.

## Route Behavior

The header navigation points to `/home`, `/product`, `/order`, `/menu`, and `/profile`.

Active-state matching treats exact routes and nested routes as active. The root route does not appear in primary navigation because `/home` is the authenticated dashboard entry.

## Error And Empty States

- No low-stock items: render a neutral notification button and an "All clear" dropdown.
- Missing merchant name: display `Merchant`.
- Sign-out failure: keep the user on the page and allow another attempt.
- Nonexistent Settings and Help links are removed.

## Verification

- A static source check must confirm dashboard pages no longer import `MerchantHeader` or `Navbar`.
- Header-focused ESLint must pass.
- The merchant production build must pass.
- Customer files and unresolved customer merge conflicts must remain untouched.
