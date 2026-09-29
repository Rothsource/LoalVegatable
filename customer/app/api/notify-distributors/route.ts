// customer/app/api/notify-distributors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// web-push needs Node's crypto module, not the Edge runtime.
export const runtime = 'nodejs';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!, // e.g. 'mailto:you@loalvegetable.com'
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Service-role client: reads every distributor's subscription regardless of RLS,
// and reads the order regardless of who's asking. NEVER expose this key to the client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400 });

  // Look the order up ourselves — never trust title/body/amount from the client.
  // Also confirms the order is real and still pending before waking anyone up.
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(`
      id, status, total_amount,
      items:order_items (
        products ( merchant_id )
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
  }
  if (order.status !== 'pending') {
    // Already claimed, cancelled, etc. — nothing to notify.
    return NextResponse.json({ ok: true, sent: 0, reason: 'Order is no longer pending' });
  }

  const orderMerchantId = (order as any)?.items?.[0]?.products?.merchant_id;
  if (!orderMerchantId) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No community merchant found for order' });
  }

  // Find distributors belonging to this specific community farm
  const { data: communityDists, error: distError } = await supabaseAdmin
    .from('profile_distributors')
    .select('id')
    .eq('merchant_id', orderMerchantId)
    .eq('status', 'active');

  if (distError) {
    return NextResponse.json({ ok: false, error: distError.message }, { status: 500 });
  }

  const communityDistIds = (communityDists || []).map((d: any) => d.id);
  if (communityDistIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No distributors registered for this community' });
  }

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('role', 'distributor')
    .in('user_id', communityDistIds);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({
    title: 'New order to fulfil',
    body: `Order #${String(order.id).slice(0, 8)} · $${Number(order.total_amount).toFixed(2)} — tap to accept or deny.`,
    url: 'http://localhost:3001/distributor/orders', // TODO: swap to your real domain once deployed
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

  return NextResponse.json({ ok: true, sent });
}