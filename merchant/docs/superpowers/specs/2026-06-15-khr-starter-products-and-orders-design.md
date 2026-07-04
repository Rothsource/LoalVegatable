# KHR Starter Products and Honest Orders Design

## Scope

This change applies only to the active merchant routes: `/product` and `/order`.

## Products

Ten starter vegetable rows use stable `starter-kh-*` slugs, whole-number Khmer
riel prices, useful stock data, and public vegetable images. Starter rows are
not recreated during normal product loading, so a merchant's later catalog
changes remain authoritative.

The seed uses the existing authenticated browser Supabase client and the same
`products` columns already used by manual product creation. If insertion fails,
the product page keeps working and displays the database error through its
existing toast system.

All product prices will be displayed and edited as Khmer riel. A shared
formatter will produce values such as `៛ 4,000`.

Removing a product archives it by setting `is_active` to false. The product is
hidden from customers, remains visible under the Archived filter, and can be
restored. Refreshing does not recreate or reactivate it.

## Orders

The merchant repository has no orders table or orders API. The current `/order`
page is demo-only state containing products and USD values unrelated to the
merchant's Supabase catalog.

The demo orders will be removed. Until a real customer checkout writes orders
to a backend, `/order` will show a professional empty state explaining that
customer orders will appear there. This avoids presenting fabricated orders or
products.

## Verification

Automated checks will cover starter product count, unique stable slugs,
whole-number KHR prices, and KHR formatting. TypeScript, focused ESLint, route
assertions, and a production build will verify integration.
