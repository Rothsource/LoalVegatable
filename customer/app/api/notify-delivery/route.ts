// customer/app/api/notify-delivery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// web-push needs Node's crypto module, not the Edge runtime.
export const runtime = 'nodejs';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Service-role client: reads every rider's subscription and the order's
// distributor/pickup location regardless of RLS. NEVER expose this key client-side.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function sendTo(sub: { endpoint: string; p256dh: string; auth: string; id: string }, payload: string) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );
    return true;
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
    }
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400, headers: CORS_HEADERS });

  // Look the order up ourselves — never trust status/amount from the client.
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_id, distributor_id, total_amount')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404, headers: CORS_HEADERS });
  }
  if (order.status !== 'out_for_delivery') {
    return NextResponse.json({ ok: true, sent: 0, reason: 'Order is not out_for_delivery' }, { headers: CORS_HEADERS });
  }

  // Pickup location: distributor hub location first -> fallback to merchant_locations
  let pickupAddress = 'Pickup location unavailable';
  if (order.distributor_id) {
    const { data: dist } = await supabaseAdmin
      .from('profile_distributors')
      .select('merchant_id, address')
      .eq('id', order.distributor_id)
      .maybeSingle();

    if (dist?.address) {
      pickupAddress = dist.address;
    } else if (dist?.merchant_id) {
      const { data: loc } = await supabaseAdmin
        .from('merchant_locations')
        .select('address, latitude, longitude')
        .eq('merchant_id', dist.merchant_id)
        .maybeSingle();
      if (loc?.address) pickupAddress = loc.address;
    }
  }

  let sent = 0;

  // --- Notify riders (only riders who are currently active/on-duty) ---
  const { data: activeDeliveries } = await supabaseAdmin
    .from('deliveries')
    .select('user_id')
    .eq('is_active', true);

  const activeRiderIds = new Set((activeDeliveries || []).map((d) => d.user_id).filter(Boolean));

  const { data: riderSubs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('role', 'rider');

  // Filter out any riders who have closed their duty (is_active = false)
  const eligibleRiders = (riderSubs || []).filter((s) => !s.user_id || activeRiderIds.has(s.user_id));

  if (eligibleRiders.length > 0) {
    const riderPayload = JSON.stringify({
      title: 'New delivery available',
      body: `Pickup at ${pickupAddress} — order #${String(order.id).slice(0, 8)}.`,
      url: '/home',
    });
    const results = await Promise.all(eligibleRiders.map((s) => sendTo(s, riderPayload)));
    sent += results.filter(Boolean).length;
  }

  // --- Notify the customer (only their own subscription) ---
  if (order.user_id) {
    const { data: customerSubs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('role', 'customer')
      .eq('user_id', order.user_id);

    if (customerSubs && customerSubs.length > 0) {
      const customerPayload = JSON.stringify({
        title: 'Your order is on its way',
        body: `Order #${String(order.id).slice(0, 8)} is out for delivery.`,
        url: '/cart',
      });
      const results = await Promise.all(customerSubs.map((s) => sendTo(s, customerPayload)));
      sent += results.filter(Boolean).length;
    }
  }

  return NextResponse.json({ ok: true, sent }, { headers: CORS_HEADERS });
}