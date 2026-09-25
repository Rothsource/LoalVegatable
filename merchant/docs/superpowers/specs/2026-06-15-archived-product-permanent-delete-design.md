# Archived Product Permanent Delete Design

## Scope

Permanent deletion is available only for products already in the Archived
filter. Active products must be archived first.

## Interaction

Archived product cards show Restore and Delete permanently actions. Delete
permanently opens a distinct red warning modal that states the action cannot be
undone. Confirming deletes the product row from Supabase and removes it from
local product state.

## Safety

Archive remains the default removal flow. Permanent deletion is visually
separate, requires confirmation, and is never shown on active product cards.
