// customer/app/api/notify-delivered/route.ts
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

// Service-role client: reads the order and the customer's subscription
// regardless of RLS. NEVER expose this key client-side.
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

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400, headers: CORS_HEADERS });

  // Look the order up ourselves — never trust status from the client.
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_id')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404, headers: CORS_HEADERS });
  }
  if (order.status !== 'delivered') {
    return NextResponse.json({ ok: true, sent: 0, reason: 'Order is not delivered' }, { headers: CORS_HEADERS });
  }
  if (!order.user_id) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'Order has no customer to notify' }, { headers: CORS_HEADERS });
  }

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('role', 'customer')
    .eq('user_id', order.user_id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 }, { headers: CORS_HEADERS });

  const payload = JSON.stringify({
    title: 'Order delivered',
    body: `Order #${String(order.id).slice(0, 8)} has arrived. Enjoy!`,
    url: '/history',
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        // 410 Gone / 404 = the browser unsubscribed or the subscription expired — clean it up.
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    })
  );

  return NextResponse.json({ ok: true, sent }, { headers: CORS_HEADERS });
}