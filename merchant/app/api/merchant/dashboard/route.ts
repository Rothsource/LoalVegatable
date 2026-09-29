import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return "Pending";
  switch (status.toLowerCase()) {
    case "out_for_delivery":
      return "Out for Delivery";
    case "delivered":
      return "Delivered";
    case "accepted":
      return "Preparing";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  let merchantId = searchParams.get("merchantId");

  // Fallback to bearer token if merchantId not passed
  if (!merchantId) {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data: { user } } = await admin.auth.getUser(token);
      if (user) merchantId = user.id;
    }
  }

  if (!merchantId) {
    return NextResponse.json({ error: "Merchant ID is required." }, { status: 400 });
  }

  try {
    // 1. Merchant profile
    const { data: profile } = await admin
      .from("profile_merchants")
      .select("id, full_name, community_name, province")
      .eq("id", merchantId)
      .maybeSingle();

    // 2. Products owned by this merchant
    const { data: products, error: prodError } = await admin
      .from("products")
      .select("id, name, unit, price, stock_quantity, profile_pic_url, is_active, created_at")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (prodError) {
      return NextResponse.json({ error: prodError.message }, { status: 500 });
    }

    const allProducts = products || [];
    const prodMap = new Map(allProducts.map((p) => [p.id, p]));
    const prodIds = allProducts.map((p) => p.id);

    const lowStockProducts = allProducts
      .filter((p) => Number(p.stock_quantity ?? 0) <= 10)
      .sort((a, b) => Number(a.stock_quantity ?? 0) - Number(b.stock_quantity ?? 0));

    // If no products exist yet
    if (prodIds.length === 0) {
      const emptyStats = {
        revenue: "0 KHR",
        revenueNumber: 0,
        orders: 0,
        sold: 0,
        customers: 0,
        revenueData: [0, 0, 0, 0, 0, 0, 0],
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
      };

      return NextResponse.json({
        success: true,
        stats: {
          day: emptyStats,
          week: { ...emptyStats, labels: ["W1", "W2", "W3", "W4", "W5", "W6", "This"] },
          month: { ...emptyStats, labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "This"] },
          allTime: { revenue: "0 KHR", orders: 0, sold: 0, customers: 0 },
        },
        recentOrders: [],
        products: [],
        lowStockProducts: [],
        profile,
      });
    }

    // 3. Order items belonging to these products
    const { data: items, error: itemsError } = await admin
      .from("order_items")
      .select("id, order_id, product_id, quantity, unit_price, total_price, created_at")
      .in("product_id", prodIds);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    const orderItems = items || [];
    const orderIds = [...new Set(orderItems.map((i) => i.order_id))];

    // Group items by order_id
    const itemsByOrder = new Map<string, typeof orderItems>();
    orderItems.forEach((i) => {
      if (!itemsByOrder.has(i.order_id)) itemsByOrder.set(i.order_id, []);
      itemsByOrder.get(i.order_id)!.push(i);
    });

    // 4. Parent orders
    let parentOrders: any[] = [];
    if (orderIds.length > 0) {
      const { data: ordersData, error: ordersError } = await admin
        .from("orders")
        .select(`
          id, created_at, status, payment_status, total_amount, user_id,
          addresses ( street, province, phone, recipient_name ),
          customer:user_id ( first_name, last_name )
        `)
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (ordersError) {
        return NextResponse.json({ error: ordersError.message }, { status: 500 });
      }
      parentOrders = ordersData || [];
    }

    // 5. Recent orders feed (top 6)
    const recentOrders = parentOrders.slice(0, 6).map((o) => {
      const oItems = itemsByOrder.get(o.id) || [];
      const itemSummary =
        oItems
          .map((it) => {
            const p = prodMap.get(it.product_id);
            return `${p?.name || "Produce"} x${it.quantity}`;
          })
          .join(", ") || "Fresh Produce";

      const merchantRev = oItems.reduce(
        (acc, it) => acc + Number(it.total_price || (it.quantity * it.unit_price) || 0),
        0
      );

      const addr = Array.isArray(o.addresses) ? o.addresses[0] : o.addresses;
      const custName =
        [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ") ||
        addr?.recipient_name ||
        "Customer";

      return {
        id: `#${o.id.slice(0, 6)}`,
        fullId: o.id,
        customer: custName,
        items: itemSummary,
        total: `${merchantRev.toLocaleString()} KHR`,
        totalNumber: merchantRev,
        status: formatStatus(o.status),
        rawStatus: o.status,
        time: formatRelativeTime(o.created_at),
        createdAt: o.created_at,
      };
    });

    // 6. Aggregate analytics calculations
    const now = new Date();
    const validOrders = parentOrders.filter((o) => o.status !== "cancelled");

    // Helper: calculate total revenue and items sold for a list of orders
    function calcMetrics(ordersList: any[]) {
      let revenue = 0;
      let sold = 0;
      const customerIds = new Set<string>();

      ordersList.forEach((o) => {
        if (o.user_id) customerIds.add(o.user_id);
        const oItems = itemsByOrder.get(o.id) || [];
        oItems.forEach((it) => {
          sold += Number(it.quantity || 0);
          revenue += Number(it.total_price || (it.quantity * it.unit_price) || 0);
        });
      });

      return {
        revenue,
        revenueFormatted: `${revenue.toLocaleString()} KHR`,
        orders: ordersList.length,
        sold,
        customers: customerIds.size,
      };
    }

    // --- DAY BUCKETING (Last 7 Days) ---
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayLabels: string[] = [];
    const dayRevenueData: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dayLabels.push(i === 0 ? "Today" : dayNames[d.getDay()]);
    }

    const todayOrders: any[] = [];
    validOrders.forEach((o) => {
      const oDate = new Date(o.created_at);
      const diffDays = Math.floor(
        (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
          new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        todayOrders.push(o);
      }

      if (diffDays >= 0 && diffDays < 7) {
        const idx = 6 - diffDays;
        const oItems = itemsByOrder.get(o.id) || [];
        const rev = oItems.reduce(
          (acc, it) => acc + Number(it.total_price || (it.quantity * it.unit_price) || 0),
          0
        );
        dayRevenueData[idx] += rev;
      }
    });

    const dayMetrics = calcMetrics(todayOrders);

    // --- WEEK BUCKETING (Last 7 Weeks) ---
    const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "This"];
    const weekRevenueData: number[] = [0, 0, 0, 0, 0, 0, 0];
    const thisWeekOrders: any[] = [];

    validOrders.forEach((o) => {
      const oDate = new Date(o.created_at);
      const diffWeeks = Math.floor((now.getTime() - oDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

      if (diffWeeks === 0) {
        thisWeekOrders.push(o);
      }

      if (diffWeeks >= 0 && diffWeeks < 7) {
        const idx = 6 - diffWeeks;
        const oItems = itemsByOrder.get(o.id) || [];
        const rev = oItems.reduce(
          (acc, it) => acc + Number(it.total_price || (it.quantity * it.unit_price) || 0),
          0
        );
        weekRevenueData[idx] += rev;
      }
    });

    const weekMetrics = calcMetrics(thisWeekOrders);

    // --- MONTH BUCKETING (Last 7 Months) ---
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthLabels: string[] = [];
    const monthRevenueData: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 6; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(i === 0 ? "This" : monthNames[m.getMonth()]);
    }

    const thisMonthOrders: any[] = [];
    validOrders.forEach((o) => {
      const oDate = new Date(o.created_at);
      const diffMonths =
        (now.getFullYear() - oDate.getFullYear()) * 12 + (now.getMonth() - oDate.getMonth());

      if (diffMonths === 0) {
        thisMonthOrders.push(o);
      }

      if (diffMonths >= 0 && diffMonths < 7) {
        const idx = 6 - diffMonths;
        const oItems = itemsByOrder.get(o.id) || [];
        const rev = oItems.reduce(
          (acc, it) => acc + Number(it.total_price || (it.quantity * it.unit_price) || 0),
          0
        );
        monthRevenueData[idx] += rev;
      }
    });

    const monthMetrics = calcMetrics(thisMonthOrders);
    const allTimeMetrics = calcMetrics(validOrders);

    return NextResponse.json({
      success: true,
      stats: {
        day: {
          revenue: dayMetrics.revenueFormatted,
          revenueNumber: dayMetrics.revenue,
          orders: dayMetrics.orders,
          sold: dayMetrics.sold,
          customers: dayMetrics.customers,
          revenueData: dayRevenueData,
          labels: dayLabels,
        },
        week: {
          revenue: weekMetrics.revenueFormatted,
          revenueNumber: weekMetrics.revenue,
          orders: weekMetrics.orders,
          sold: weekMetrics.sold,
          customers: weekMetrics.customers,
          revenueData: weekRevenueData,
          labels: weekLabels,
        },
        month: {
          revenue: monthMetrics.revenueFormatted,
          revenueNumber: monthMetrics.revenue,
          orders: monthMetrics.orders,
          sold: monthMetrics.sold,
          customers: monthMetrics.customers,
          revenueData: monthRevenueData,
          labels: monthLabels,
        },
        allTime: allTimeMetrics,
      },
      recentOrders,
      products: allProducts.slice(0, 6),
      lowStockProducts,
      allProductsCount: allProducts.length,
      profile,
    });
  } catch (err: any) {
    console.error("Dashboard calculation error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
