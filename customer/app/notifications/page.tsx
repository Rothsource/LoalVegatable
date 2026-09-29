'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, CheckCircle2, Clock, Truck, Package, MapPin, 
  Phone, ArrowRight, RefreshCw, AlertCircle, ShoppingBag, 
  ExternalLink, ChevronRight, ShieldCheck, CreditCard,
  ChevronDown, ChevronUp, Navigation, Eye
} from 'lucide-react';
import CustomerOrderTrackingMap from '@/components/CustomerOrderTrackingMap';
import { CircularLoader } from '@/components/CustomerSkeleton';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_img: string;
  unit: string;
}

interface CustomerOrderNotification {
  id: string;
  created_at: string;
  status: string;
  payment_status: string;
  total_amount: number;
  address_street: string;
  address_province: string;
  customer_phone: string;
  address_lat?: number | null;
  address_lng?: number | null;
  distributor_id?: string | null;
  delivery_id?: string | null;
  items: OrderItem[];
}

const brandGreen = '#1b4332';
const deepGreen = '#1b4332';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<CustomerOrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [liveUpdateText, setLiveUpdateText] = useState<string | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchOrderNotifications = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? (await supabase.auth.getUser()).data?.user;
      if (!user) {
        setIsLoggedIn(false);
        setNotifications([]);
        setLoading(false);
        router.replace('/auth/login?redirectTo=/notifications');
        return;
      }
      setIsLoggedIn(true);

      // 1. Fetch all orders for this customer
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, created_at, status, payment_status, total_amount, address_id, distributor_id, delivery_id,
          addresses ( street, province, phone, lat, lng )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError || !orders || orders.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const orderIds = orders.map(o => o.id);

      // 2. Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, unit_price, total_price')
        .in('order_id', orderIds);

      // 3. Fetch products details for items
      const productIds = [...new Set((items || []).map(i => i.product_id).filter(Boolean))];
      let productMap = new Map<string, any>();

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, profile_pic_url, unit')
          .in('id', productIds);

        if (products) {
          products.forEach(p => productMap.set(String(p.id), p));
        }
      }

      // 4. Combine into clean notifications list
      const autoExpanded: Record<string, boolean> = {};

      const compiled: CustomerOrderNotification[] = orders.map((o: any) => {
        const orderItems = (items || [])
          .filter(i => i.order_id === o.id)
          .map(i => {
            const prod = productMap.get(String(i.product_id));
            return {
              id: i.id,
              quantity: i.quantity,
              unit_price: i.unit_price,
              total_price: i.total_price,
              product_name: prod?.name || 'Fresh Produce',
              product_img: prod?.profile_pic_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=300&fit=crop',
              unit: prod?.unit || 'unit',
            };
          });

        const addr = Array.isArray(o.addresses) ? o.addresses[0] : o.addresses;

        const isCurrentlyDelivering = o.status === 'out_for_delivery' || o.status === 'delivering';
        if (isCurrentlyDelivering) {
          autoExpanded[o.id] = true;
        }

        return {
          id: o.id,
          created_at: o.created_at,
          status: o.status || 'pending',
          payment_status: o.payment_status || 'pending',
          total_amount: o.total_amount || 0,
          address_street: addr?.street || '',
          address_province: addr?.province || '',
          customer_phone: addr?.phone || '',
          address_lat: addr?.lat != null ? Number(addr.lat) : null,
          address_lng: addr?.lng != null ? Number(addr.lng) : null,
          distributor_id: o.distributor_id || null,
          delivery_id: o.delivery_id || null,
          items: orderItems,
        };
      });

      setNotifications(compiled);
      setExpandedOrderIds((prev) => ({ ...autoExpanded, ...prev }));
    } catch (err) {
      console.error('Error loading customer notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderNotifications();

    // Listen for Realtime updates on orders
    const channel = supabase
      .channel('customer-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          setLiveUpdateText('Order status update received.');
          void fetchOrderNotifications();
          setTimeout(() => setLiveUpdateText(null), 4000);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (statusFilter === 'active') {
        return n.status === 'pending' || n.status === 'accepted' || n.status === 'out_for_delivery' || n.status === 'delivering';
      }
      if (statusFilter === 'completed') {
        return n.status === 'delivered';
      }
      return true;
    });
  }, [notifications, statusFilter]);

  const getOrderStatusConfig = (status: string, paymentStatus: string) => {
    switch (status) {
      case 'accepted':
        return {
          title: 'Merchant Accepted Order',
          desc: 'The merchant has accepted your paid order and is packaging your fresh produce.',
          badgeBg: '#eff6ef',
          badgeText: deepGreen,
          badgeBorder: '#cce8cc',
          step: 3,
          icon: <ShieldCheck size={18} color={deepGreen} />,
        };
      case 'out_for_delivery':
      case 'delivering':
        return {
          title: 'Out for Delivery',
          desc: 'Your fresh vegetables are on the road with the driver.',
          badgeBg: '#e0f2fe',
          badgeText: '#0369a1',
          badgeBorder: '#bae6fd',
          step: 4,
          icon: <Truck size={18} color="#0284c7" />,
        };
      case 'delivered':
        return {
          title: 'Delivered',
          desc: 'Your vegetables have been safely delivered to your address.',
          badgeBg: '#ecfdf5',
          badgeText: '#065f46',
          badgeBorder: '#a7f3d0',
          step: 5,
          icon: <CheckCircle2 size={18} color="#059669" />,
        };
      case 'cancelled':
        return {
          title: paymentStatus === 'refunded' ? 'Merchant Declined (100% Refunded)' : 'Order Cancelled',
          desc: paymentStatus === 'refunded'
            ? 'The merchant was unable to accept your order. Your upfront payment has been 100% refunded to your account.'
            : 'This order was cancelled.',
          badgeBg: '#fff1f2',
          badgeText: '#be123c',
          badgeBorder: '#fecdd3',
          step: 0,
          icon: <AlertCircle size={18} color="#e11d48" />,
        };
      default:
        return {
          title: 'Paid · Awaiting Merchant Acceptance',
          desc: 'Your order was paid first and sent to the merchant for harvest confirmation.',
          badgeBg: '#fefce8',
          badgeText: '#854d0e',
          badgeBorder: '#fef08a',
          step: 2,
          icon: <Clock size={18} color="#ca8a04" />,
        };
    }
  };

  const stepsList = [
    { n: 1, label: 'Ordered' },
    { n: 2, label: 'Paid First' },
    { n: 3, label: 'Accepted' },
    { n: 4, label: 'In Transit' },
    { n: 5, label: 'Delivered' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FBF8F2', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .notification-card {
          background: #fff;
          border-radius: 24px;
          border: 1.5px solid #edf0ea;
          box-shadow: 0 4px 20px rgba(59,43,32,0.04);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .notification-card:hover {
          box-shadow: 0 12px 36px rgba(46, 111, 64, 0.1);
          transform: translateY(-2px);
        }
        .filter-chip {
          padding: 8px 18px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .filter-chip:hover {
          transform: translateY(-1px);
        }
        .filter-chip:active {
          transform: scale(0.97);
        }
      `}</style>

      <main className="enter-up" style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 5% 80px' }}>
        {liveUpdateText && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: deepGreen,
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Bell size={16} />
            {liveUpdateText}
          </div>
        )}

        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: '#eff6ef', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: deepGreen,
              }}>
                <Bell size={20} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#182216', margin: 0, letterSpacing: '-0.4px' }}>
                Order Status & Updates
              </h1>
            </div>
            <p style={{ color: '#647060', fontSize: '14px', margin: '6px 0 0 50px' }}>
              Track your ordered vegetables and live distributor progress
            </p>
          </div>

          <button
            onClick={fetchOrderNotifications}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '12px',
              background: '#fff', border: '1.5px solid #dfe6d9',
              color: '#182216', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Status
          </button>
        </div>

        {(loading || isLoggedIn === null) && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <CircularLoader size={38} label="Checking order updates…" />
          </div>
        )}

        {/* Not Logged In State */}
        {!loading && isLoggedIn === false && (
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '50px 30px',
            textAlign: 'center',
            border: '1.5px solid #edf0ea',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#eff6ef', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', color: deepGreen,
            }}>
              <Bell size={28} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#182216', margin: '0 0 8px' }}>
              Sign in to view your order updates
            </h2>
            <p style={{ color: '#647060', fontSize: '14px', margin: '0 0 24px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Log in with your customer account to view live order tracking, distributor confirmations, and vegetable statuses.
            </p>
            <Link
              href="/auth/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '13px 28px', borderRadius: '12px',
                background: deepGreen, color: '#fff', fontWeight: '700',
                fontSize: '14px', textDecoration: 'none',
              }}
            >
              Sign In Now <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* Logged in Content */}
        {!loading && isLoggedIn && (
          <>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Updates (${notifications.length})` },
                { id: 'active', label: `Active Deliveries (${notifications.filter(n => n.status !== 'delivered' && n.status !== 'cancelled').length})` },
                { id: 'completed', label: `Completed (${notifications.filter(n => n.status === 'delivered').length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className="filter-chip"
                  style={{
                    backgroundColor: statusFilter === tab.id ? deepGreen : '#fff',
                    color: statusFilter === tab.id ? '#fff' : '#647060',
                    border: `1.5px solid ${statusFilter === tab.id ? deepGreen : '#dfe6d9'}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '50px 30px',
                textAlign: 'center',
                border: '1.5px solid #edf0ea',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#f6f8f3', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 16px', color: '#647060',
                }}>
                  <Package size={28} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#182216', margin: '0 0 6px' }}>
                  No order status updates yet
                </h3>
                <p style={{ color: '#647060', fontSize: '14px', margin: '0 0 20px' }}>
                  When you order vegetables from local farms, live tracking updates will appear here.
                </p>
                <Link
                  href="/shop"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '12px 24px', borderRadius: '12px',
                    background: deepGreen, color: '#fff', fontWeight: '700',
                    fontSize: '13px', textDecoration: 'none',
                  }}
                >
                  Browse Fresh Vegetables <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filtered.map(order => {
                  const statusConfig = getOrderStatusConfig(order.status, order.payment_status);
                  const isPaid = order.payment_status === 'paid';
                  const dateStr = new Date(order.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <article key={order.id} className="notification-card" style={{ padding: '24px' }}>
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', borderBottom: '1.5px solid #f3f5f0', paddingBottom: '18px', marginBottom: '18px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#182216' }}>
                              Order #{order.id.slice(0, 8)}
                            </span>
                            <span style={{ fontSize: '12px', color: '#889584', fontWeight: '600' }}>
                              {dateStr}
                            </span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '3px 10px', borderRadius: '100px',
                              fontSize: '11px', fontWeight: '800',
                              background: statusConfig.badgeBg, color: statusConfig.badgeText,
                              border: `1px solid ${statusConfig.badgeBorder}`,
                            }}>
                              {statusConfig.icon}
                              {statusConfig.title}
                            </span>
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#556052', fontWeight: '500' }}>
                            {statusConfig.desc}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '11px', fontWeight: '800',
                            padding: '3px 10px', borderRadius: '8px',
                            background: isPaid ? '#eff6ef' : '#fffbeb',
                            color: isPaid ? deepGreen : '#b45309',
                            border: `1px solid ${isPaid ? '#cce8cc' : '#fde68a'}`,
                            marginBottom: '4px',
                          }}>
                            {isPaid ? 'Payment Confirmed' : 'Payment Pending'}
                          </span>
                          <div style={{ fontSize: '17px', fontWeight: '900', color: deepGreen }}>
                            {order.total_amount.toLocaleString()} KHR
                          </div>
                        </div>
                      </div>

                      {/* 5-Step Visual Progress Bar */}
                      {order.status !== 'cancelled' && (
                        <div style={{ background: '#f8faf7', borderRadius: '16px', padding: '16px', marginBottom: '20px', border: '1px solid #edf0ea' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                            {stepsList.map((step, idx) => {
                              const activeStep = statusConfig.step;
                              const isCompleted = activeStep >= step.n;
                              const isCurrent = activeStep === step.n;

                              return (
                                <React.Fragment key={step.n}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                    <div style={{
                                      width: '26px', height: '26px', borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '11px', fontWeight: '800',
                                      background: isCompleted ? deepGreen : '#e5e7eb',
                                      color: isCompleted ? '#fff' : '#9ca3af',
                                      boxShadow: isCurrent ? '0 0 0 3px rgba(13,179,13,0.25)' : 'none',
                                      transition: 'all 0.3s ease',
                                    }}>
                                      {isCompleted ? <CheckCircle2 size={14} color="#fff" /> : step.n}
                                    </div>
                                    <span style={{
                                      fontSize: '11px', fontWeight: isCurrent ? '800' : '600',
                                      color: isCurrent ? deepGreen : isCompleted ? '#182216' : '#9ca3af',
                                      marginTop: '6px', textAlign: 'center',
                                    }}>
                                      {step.label}
                                    </span>
                                  </div>
                                  {idx < stepsList.length - 1 && (
                                    <div style={{
                                      flex: 1, height: '2px',
                                      background: activeStep > step.n ? deepGreen : '#e5e7eb',
                                      margin: '0 8px', marginBottom: '18px',
                                      transition: 'background 0.3s ease',
                                    }} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Product items in this order */}
                      <div style={{ marginBottom: '18px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#889584', display: 'block', marginBottom: '10px' }}>
                          Vegetables in this Delivery
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                          {order.items.map(item => (
                            <div key={item.id} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              background: '#f9fafb', borderRadius: '12px', padding: '8px 12px',
                              border: '1px solid #f0f2ee',
                            }}>
                              <img
                                src={item.product_img}
                                alt={item.product_name}
                                style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop'; }}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#182216', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.product_name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#647060', fontWeight: '600' }}>
                                  {item.quantity} {item.unit} · {item.total_price.toLocaleString()} KHR
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery destination footer & Action Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '14px', borderTop: '1px solid #f3f5f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <MapPin size={15} color={brandGreen} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: '#556052', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.address_province ? `${order.address_province}, ${order.address_street}` : 'Delivery destination registered'}
                            {order.customer_phone ? ` · Contact: ${order.customer_phone}` : ''}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Resume Payment Action if Accepted but Pending Payment */}
                          {order.status === 'accepted' && !isPaid && (
                            <Link
                              href="/cart"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '10px',
                                background: '#0066b2', color: '#fff', fontSize: '12px',
                                fontWeight: '800', textDecoration: 'none',
                              }}
                            >
                              <CreditCard size={13} /> Complete ABA Payment
                            </Link>
                          )}

                          {/* Trace Delivery & Details Toggle Button */}
                          <button
                            type="button"
                            onClick={() => toggleExpand(order.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '7px',
                              padding: '8px 16px', borderRadius: '10px',
                              background: (order.status === 'out_for_delivery' || order.status === 'delivering')
                                ? '#eff6ef'
                                : expandedOrderIds[order.id]
                                ? '#f6f8f4'
                                : '#fff',
                              color: (order.status === 'out_for_delivery' || order.status === 'delivering')
                                ? deepGreen
                                : '#182216',
                              fontSize: '12px', fontWeight: '800',
                              border: (order.status === 'out_for_delivery' || order.status === 'delivering')
                                ? `1.5px solid ${deepGreen}`
                                : '1.5px solid #dfe6d9',
                              cursor: 'pointer',
                              boxShadow: (order.status === 'out_for_delivery' || order.status === 'delivering')
                                ? '0 2px 10px rgba(10,73,10,0.12)'
                                : 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Truck size={14} color={(order.status === 'out_for_delivery' || order.status === 'delivering') ? deepGreen : '#647060'} />
                            <span>
                              {(order.status === 'out_for_delivery' || order.status === 'delivering')
                                ? (expandedOrderIds[order.id] ? 'Hide Live Map' : 'Trace Live Delivery')
                                : (expandedOrderIds[order.id] ? 'Hide Details' : 'View Details & Trace Route')}
                            </span>
                            {expandedOrderIds[order.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section with Live Delivery Tracking Map & Full Order Details */}
                      {expandedOrderIds[order.id] && (
                        <div style={{ marginTop: '22px', borderTop: '1.5px dashed #edf0ea', paddingTop: '22px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Truck size={18} color={deepGreen} />
                              <span style={{ fontSize: '14px', fontWeight: '800', color: '#182216' }}>
                                Live Order Tracing & Delivery Route
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#647060', fontWeight: '600' }}>
                              Order Reference: #{order.id}
                            </span>
                          </div>

                          {/* Live Map Component */}
                          <div style={{ marginBottom: '20px' }}>
                            <CustomerOrderTrackingMap
                              orderId={order.id}
                              status={order.status}
                              destination={{
                                address: [order.address_street, order.address_province].filter(Boolean).join(', ') || 'Your registered address',
                                lat: order.address_lat,
                                lng: order.address_lng,
                              }}
                              pickup={{
                                label: 'Local Organic Vegetable Hub',
                                address: 'Fresh Harvest Depot, Cambodia',
                              }}
                            />
                          </div>

                          {/* Full Order Breakdown Panel */}
                          <div style={{
                            background: '#fcfdfa',
                            borderRadius: '16px',
                            border: '1px solid #edf0ea',
                            padding: '16px 20px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #edf0ea', paddingBottom: '12px', marginBottom: '12px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#647060' }}>
                                Delivery Details & Receipt
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: deepGreen }}>
                                {order.total_amount.toLocaleString()} KHR
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12px', color: '#556052' }}>
                              <div>
                                <span style={{ fontWeight: '700', color: '#182216', display: 'block', marginBottom: '2px' }}>Destination Address:</span>
                                <span>{order.address_street ? `${order.address_street}, ` : ''}{order.address_province || 'Saved location'}</span>
                              </div>
                              <div>
                                <span style={{ fontWeight: '700', color: '#182216', display: 'block', marginBottom: '2px' }}>Recipient Contact:</span>
                                <span>{order.customer_phone || 'Registered user contact'}</span>
                              </div>
                              <div>
                                <span style={{ fontWeight: '700', color: '#182216', display: 'block', marginBottom: '2px' }}>Payment Status:</span>
                                <span style={{ color: isPaid ? deepGreen : '#b45309', fontWeight: '700' }}>
                                  {isPaid ? 'Paid in Full (ABA KHQR)' : 'Pending Customer Payment'}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontWeight: '700', color: '#182216', display: 'block', marginBottom: '2px' }}>Total Produce:</span>
                                <span>{order.items.reduce((s, i) => s + i.quantity, 0)} units ({order.items.length} unique vegetables)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
