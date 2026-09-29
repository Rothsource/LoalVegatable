import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function deleteUserCompletely(userId: string) {
  // 1. Unlink from orders (preserves order revenue and history without foreign key errors)
  await supabaseAdmin.from("orders").update({ user_id: null }).eq("user_id", userId);
  await supabaseAdmin.from("orders").update({ distributor_id: null }).eq("distributor_id", userId);

  // 2. Clean up any delivery records referencing this user
  const { data: linkedDeliveries } = await supabaseAdmin
    .from("deliveries")
    .select("id")
    .or(`user_id.eq.${userId},id.eq.${userId}`);

  for (const del of linkedDeliveries ?? []) {
    await supabaseAdmin.from("orders").update({ delivery_id: null }).eq("delivery_id", del.id);
    await supabaseAdmin.from("deliveries").delete().eq("id", del.id);
  }

  // 3. Products & Merchant Data
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("merchant_id", userId);

  const productIds = (products ?? []).map((p) => p.id);

  if (productIds.length > 0) {
    await supabaseAdmin.from("order_items").update({ product_id: null }).in("product_id", productIds);
    await supabaseAdmin.from("cart_items").delete().in("product_id", productIds);
    await supabaseAdmin.from("reviews").delete().in("product_id", productIds);
    await supabaseAdmin.from("products").delete().eq("merchant_id", userId);
  }

  // 4. Cart items, addresses, reviews for buyer
  await supabaseAdmin.from("cart_items").delete().eq("user_id", userId);
  await supabaseAdmin.from("reviews").delete().eq("user_id", userId);

  // Unlink user's addresses from orders to prevent foreign key constraint violation
  const { data: userAddresses } = await supabaseAdmin
    .from("addresses")
    .select("id")
    .eq("user_id", userId);

  const addressIds = (userAddresses ?? []).map((a) => a.id);
  if (addressIds.length > 0) {
    await supabaseAdmin
      .from("orders")
      .update({ address_id: null })
      .in("address_id", addressIds);
  }

  await supabaseAdmin.from("addresses").delete().eq("user_id", userId);

  // 5. Distributors
  const { data: linkedDistributors } = await supabaseAdmin
    .from("profile_distributors")
    .select("id")
    .or(`merchant_id.eq.${userId},id.eq.${userId}`);

  for (const dist of linkedDistributors ?? []) {
    await supabaseAdmin.from("orders").update({ distributor_id: null }).eq("distributor_id", dist.id);
    await supabaseAdmin.from("profile_distributors").delete().eq("id", dist.id);
    if (dist.id !== userId) {
      await supabaseAdmin.auth.admin.deleteUser(dist.id).catch(() => {});
    }
  }

  // 6. Delete all profile table entries
  await supabaseAdmin.from("profile_merchants").delete().eq("id", userId);
  await supabaseAdmin.from("profile_users").delete().eq("id", userId);
  await supabaseAdmin.from("profile_distributors").delete().eq("id", userId);
  await supabaseAdmin.from("deliveries").delete().eq("id", userId);

  // 7. Clean up Storage files owned by this user (prevent storage foreign key violation)
  try {
    const { data: files } = await supabaseAdmin.storage.from("products-images").list(`merchants/${userId}`);
    if (files && files.length > 0) {
      const paths = files.map((f) => `merchants/${userId}/${f.name}`);
      await supabaseAdmin.storage.from("products-images").remove(paths);
    }
  } catch (storageErr) {
    console.warn("Storage cleanup warning:", storageErr);
  }

  // 8. Delete from auth.users
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError && !authError.message.includes("User not found")) {
    throw new Error(authError.message);
  }

  return { ok: true };
}
