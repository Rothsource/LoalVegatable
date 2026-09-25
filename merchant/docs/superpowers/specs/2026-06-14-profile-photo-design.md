# Merchant Profile Photo Design

## Goal

Allow a signed-in merchant to upload, replace, or remove a profile photo from the Profile page and display the saved photo in the shared merchant header.

## User Experience

The Profile page shows a circular photo preview above the account fields. The merchant can select a JPG, PNG, or WebP image up to 5 MB, replace it, or remove it. The selected image is previewed locally and uploaded only when the merchant submits the account form.

The shared header displays the saved profile photo in the account button and menu. If no photo exists or the image fails to load, the header falls back to the merchant's initial.

## Data Flow

The Profile page loads `profile_url` and account fields from `profile_merchants`, with auth metadata as a fallback. On submit, a newly selected image uploads to the existing `products-images` bucket at `merchants/{userId}/profile`. The account API persists the resulting URL to both auth metadata and `profile_merchants.profile_url`.

Removing a photo sends an empty `profileUrl`. The database and auth metadata are cleared; deleting the stored object is not required for this change because the fixed upload path is overwritten by later uploads.

## Validation And Errors

Only JPEG, PNG, and WebP files are accepted. Files larger than 5 MB are rejected before upload. Upload, authentication, API, and image-loading failures show a clear message while preserving the existing saved photo wherever possible.

## Scope

Modify only merchant profile, account API, shared header, and merchant pages that provide header identity data. Reuse the existing storage bucket and `profile_url` database column. Do not add customer or admin changes.

## Verification

Add focused tests for file validation and profile payload behavior where practical. Run route assertions, TypeScript, targeted lint, and source checks confirming the header receives and renders `profileUrl`.
