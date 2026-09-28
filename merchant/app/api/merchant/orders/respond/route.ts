import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { orderId, action, reason } = body as {
      orderId: string;
      action: "accept" | "deny";
      reason?: string;
    };

    if (!orderId || !action || !["accept", "deny"].includes(action)) {
      return NextResponse.json({ error: "orderId and valid action ('accept' | 'deny') are required." }, { status: 400 });
    }

    if (action === "accept") {
      const { data, error } = await admin
        .from("orders")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("id, status, payment_status, total_amount, user_id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, order: data, action: "accepted" });
    } else {
      // action === "deny" -> Merchant declines order
      // 1. Mark order as cancelled and payment refunded
      const { data: order, error } = await admin
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: "refunded",
        })
        .eq("id", orderId)
        .select("id, status, payment_status, total_amount, user_id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 2. Return / restore produce stock to products table
      try {
        const { data: orderItems } = await admin
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        if (orderItems && orderItems.length > 0) {
          for (const item of orderItems) {
            const { data: prod } = await admin
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();

            if (prod) {
              await admin
                .from("products")
                .update({ stock_quantity: (prod.stock_quantity ?? 0) + (item.quantity ?? 1) })
                .eq("id", item.product_id);
            }
          }
        }
      } catch (stockErr) {
        console.error("Failed to restore stock after order decline:", stockErr);
      }

      return NextResponse.json({
        ok: true,
        order,
        action: "cancelled",
        refunded: true,
        reason: reason || "Merchant unable to fulfill at this time",
      });
    }
  } catch (err: any) {
    console.error("Order response error:", err);
    return NextResponse.json({ error: err.message || "Failed to process order response" }, { status: 500 });
  }
}
