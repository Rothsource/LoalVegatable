// customer/app/api/orders/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { isProductExpired } from '@/lib/expiry';

export const runtime = 'nodejs';

if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface IncomingItem {
  id: string;
  qty: number;
  price: number;
  name: string;
  shopSlug: string;
  unit?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, addressId, items } = body as {
      userId: string;
      addressId: number;
      items: IncomingItem[];
    };

    if (!userId || !addressId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid order request payload' }, { status: 400 });
    }

    // 1. Enforce minimum order quantity (1kg / 1 unit up)
    for (const item of items) {
      if (!item.qty || item.qty < 1) {
        return NextResponse.json({
          ok: false,
          error: `Minimum order quantity for ${item.name || 'produce'} is 1. Please adjust your quantity.`,
        }, { status: 400 });
      }
    }

    // 2. Fetch current live products from Supabase to validate stock and expiry
    const productIds = items.map((i) => i.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from('products')
      .select('id, name, unit, price, stock_quantity, is_active, expire_date, merchant_id')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      return NextResponse.json({ ok: false, error: 'Failed to verify produce stock.' }, { status: 500 });
    }

    const dbMap = new Map(dbProducts.map((p) => [String(p.id), p]));

    // Check if any grower/merchant shop is closed
    const merchantIds = [...new Set(dbProducts.map((p) => p.merchant_id).filter(Boolean))];
    for (const mId of merchantIds) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(mId);
        const isOpenMeta = userData?.user?.user_metadata?.is_open;
        const { data: prof } = await supabaseAdmin
          .from('profile_merchants')
          .select('*')
          .eq('id', mId)
          .maybeSingle();

        const isOpen = prof?.is_open !== undefined ? prof.is_open : (isOpenMeta !== undefined ? isOpenMeta : true);
        if (isOpen === false) {
          return NextResponse.json({
            ok: false,
            error: `This farm shop is temporarily closed and not accepting new orders.`,
          }, { status: 400 });
        }
      } catch {}
    }

    // 3. Strict pre-order validations:
    for (const item of items) {
      const dbProd = dbMap.get(String(item.id));
      if (!dbProd) {
        return NextResponse.json({
          ok: false,
          error: `Product "${item.name}" was not found in catalog.`,
        }, { status: 400 });
      }

      if (!dbProd.is_active) {
        return NextResponse.json({
          ok: false,
          error: `"${dbProd.name}" is currently inactive and cannot be ordered.`,
        }, { status: 400 });
      }

      if (isProductExpired(dbProd.expire_date)) {
        return NextResponse.json({
          ok: false,
          error: `"${dbProd.name}" has expired and cannot be ordered.`,
        }, { status: 400 });
      }

      if (item.qty > dbProd.stock_quantity) {
        return NextResponse.json({
          ok: false,
          error: `Cannot order ${item.qty} of ${dbProd.name}. Only ${dbProd.stock_quantity} ${dbProd.unit || 'units'} available in stock.`,
        }, { status: 400 });
      }
    }

    // 4. Group items by merchant shop
    const byShop = items.reduce((acc, it) => {
      const dbProd = dbMap.get(String(it.id));
      const merchantId = dbProd?.merchant_id || it.shopSlug || 'default';
      (acc[merchantId] ??= []).push({ ...it, dbProd });
      return acc;
    }, {} as Record<string, Array<IncomingItem & { dbProd: any }>>);

    const createdOrderIds: string[] = [];

    // 5. Process each merchant order
    for (const [merchantId, shopItems] of Object.entries(byShop)) {
      const orderTotal = shopItems.reduce((sum, item) => sum + Number(item.dbProd?.price || item.price) * item.qty, 0);

      // Create Order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: userId,
          address_id: addressId,
          status: 'pending',
          payment_status: 'pending',
          total_amount: orderTotal,
        })
        .select('id')
        .single();

      if (orderError || !order) {
        return NextResponse.json({ ok: false, error: orderError?.message || 'Failed to create order.' }, { status: 500 });
      }

      createdOrderIds.push(order.id);

      // Insert Order Items
      const orderItemRows = shopItems.map((item) => ({
        order_id: order.id,
        product_id: String(item.id),
        quantity: item.qty,
        unit_price: Number(item.dbProd?.price || item.price),
        total_price: Number(item.dbProd?.price || item.price) * item.qty,
      }));

      const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItemRows);
      if (itemsError) {
        return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
      }

      // 6. Reduce stock quantity in database
      for (const item of shopItems) {
        const currentStock = item.dbProd?.stock_quantity ?? 0;
        const newStock = Math.max(0, currentStock - item.qty);
        await supabaseAdmin
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.id);
      }

      // 7. Send Notifications to Distributor AND Merchant
      const itemSummaries = shopItems
        .map((i) => `${i.dbProd?.name || i.name} (${i.qty} ${i.dbProd?.unit || i.unit || 'kg'})`)
        .join(', ');

      const totalKHR = Math.round(orderTotal).toLocaleString();

      // Notify Distributors via Web Push
      try {
        const { data: distSubs } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*')
          .eq('role', 'distributor');

        if (distSubs && distSubs.length > 0) {
          const distPayload = JSON.stringify({
            title: 'New harvest order to fulfil!',
            body: `Order #${order.id.slice(0, 8)} · ${itemSummaries} · ${totalKHR} KHR`,
            url: '/distributors/orders',
          });

          await Promise.all(
            distSubs.map(async (sub) => {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  distPayload
                );
              } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
                }
              }
            })
          );
        }
      } catch (err) {
        console.error('Distributor push notification error:', err);
      }

      // Notify Merchant via Web Push
      try {
        const { data: merchantSubs } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*')
          .eq('role', 'merchant')
          .eq('user_id', merchantId);

        if (merchantSubs && merchantSubs.length > 0) {
          const merchantPayload = JSON.stringify({
            title: 'New customer crop order!',
            body: `Order #${order.id.slice(0, 8)} · ${itemSummaries} · ${totalKHR} KHR`,
            url: '/order',
          });

          await Promise.all(
            merchantSubs.map(async (sub) => {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  merchantPayload
                );
              } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
                }
              }
            })
          );
        }
      } catch (err) {
        console.error('Merchant push notification error:', err);
      }
    }

    return NextResponse.json({
      ok: true,
      createdOrderIds,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Server error creating order' }, { status: 500 });
  }
}
