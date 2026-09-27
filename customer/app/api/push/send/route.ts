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

// Service-role client: reads every distributor's subscription regardless of RLS.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client — server-side only.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { orderId, title, body, url } = await req.json();

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('role', 'distributor');

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({
    title: title || 'New order to fulfil',
    body: body || `Order #${orderId} is waiting to be accepted.`,
    url: url || '/orders',
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