# Merchant Info Upload Design

## Goal

Make merchant onboarding readable, polished, and clear while preserving the existing Supabase profile, storage, and approval workflow.

## Form Layout

The page uses a compact responsive card with:

- a small LocalVeg identity row and short approval explanation;
- a two-column details section on larger screens;
- explicit dark text and visible placeholder colors on all inputs;
- one consistent focus state and field height;
- a clear error banner;
- a full-width submit button with an uploading state.

The visual style is deliberately minimal: a light gray-green page background,
one white card, subtle borders, restrained shadows, and no large decorative
gradient or oversized hero section.

## Upload Controls

Native file inputs are hidden behind accessible upload cards.

Each compact upload row provides:

- a visible `Choose file` or `Choose images` button;
- accepted-format and size guidance;
- selected filenames;
- small image previews where applicable;
- `Change` and `Remove` controls;
- support for up to three background images.

Files remain local until `Submit for Approval` is pressed. This avoids abandoned Supabase uploads when a merchant leaves onboarding without submitting.

## Validation

- Full name and province remain required.
- Images accept JPG, PNG, or WebP and must be 5 MB or smaller.
- Certificates accept PDF, JPG, or PNG and must be 10 MB or smaller.
- Background uploads are limited to three files.
- Validation failures appear in the page error banner.

## Scope

Only `merchant/app/auth/merchant-info/page.tsx` changes. Existing database columns, storage bucket, upload paths, pending redirect, and approval state remain unchanged.
