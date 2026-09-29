'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Leaf, Users, ShieldCheck, Search, ShoppingBasket, Truck, ArrowRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CircularLoader } from '@/components/CustomerSkeleton';
import { isProductExpired, getTodayDateString } from '@/lib/expiry';

// ── Design tokens ──────────────────────────────────────────────
// Pulled from real produce, not a generic SaaS gradient:
// leaf (primary), sprout (accent/highlight), carrot (warm CTA accent),
// tomato (illustration accent), paper (background), soil (dark text / dark sections)
const leaf = '#2E6F40';
const sprout = '#6FAE5C';
const carrot = '#E08D3C';
const paper = '#FBF8F2';
const soil = '#3B2B20';

interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  img: string;
  shopName: string;
}

interface Stats {
  products: number;
  farms: number;
  provinces: number;
}

// Fast in-memory cache for home page (0ms instant return)
let cachedHomeFeatured: FeaturedProduct[] | null = null;
let cachedHomeStats: Stats | null = null;
let cachedHomeTime = 0;
const HOME_CACHE_TTL = 60_000;

export default function Home() {
  const [featured, setFeatured] = useState<FeaturedProduct[]>(() => cachedHomeFeatured ?? []);
  const [stats, setStats] = useState<Stats>(() => cachedHomeStats ?? { products: 0, farms: 0, provinces: 0 });
  const [loadingFeatured, setLoadingFeatured] = useState(() => !cachedHomeFeatured);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHomeData() {
      const today = getTodayDateString();

      // ── Execute stats, merchants, and featured products in 1 single parallel roundtrip ──
      const [{ count: productCount }, { data: allMerchants }, { data: products }] = await Promise.all([
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .or(`expire_date.is.null,expire_date.gte.${today}`),
        supabase
          .from('profile_merchants')
          .select('id, province, full_name, community_name'),
        supabase
          .from('products')
          .select('id, name, price, unit, profile_pic_url, merchant_id, expire_date, categories(name)')
          .eq('is_active', true)
          .or(`expire_date.is.null,expire_date.gte.${today}`)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const provinceSet = new Set(
        (allMerchants ?? []).map((m: any) => m.province).filter(Boolean)
      );

      const nextStats = {
        products: productCount ?? 0,
        farms: (allMerchants ?? []).length,
        provinces: provinceSet.size,
      };
      setStats(nextStats);
      cachedHomeStats = nextStats;

      const validProducts = (products ?? [])
        .filter((p: any) => !isProductExpired(p.expire_date))
        .slice(0, 4);

      const merchantMap: Record<string, any> = {};
      (allMerchants ?? []).forEach((m: any) => { merchantMap[m.id] = m; });

      const nextFeatured = validProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.categories?.name ?? 'Uncategorized',
        price: Number(p.price),
        unit: p.unit ?? '',
        img: p.profile_pic_url ?? '',
        shopName: merchantMap[p.merchant_id]?.community_name || merchantMap[p.merchant_id]?.full_name || 'Local Farm',
      }));

      setFeatured(nextFeatured);
      cachedHomeFeatured = nextFeatured;
      cachedHomeTime = Date.now();
      setLoadingFeatured(false);
    }

    if (!cachedHomeFeatured || Date.now() - cachedHomeTime > HOME_CACHE_TTL) {
      loadHomeData();
    } else {
      // Revalidate quietly
      loadHomeData();
    }
  }, []);

  // ── Scroll-triggered reveal ──
  // Any element tagged .reveal or .reveal-stagger fades/rises into view the
  // first time it crosses into the viewport, then stays revealed (no re-hiding
  // on scroll back up — feels calmer than a fade-out/fade-in loop).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll('.reveal, .reveal-stagger');

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      icon: <Search size={24} color={leaf} />,
      title: 'Browse the harvest',
      desc: 'Search fresh vegetables by farm, province, or category — everything listed is in stock right now.',
    },
    {
      icon: <ShoppingBasket size={24} color={leaf} />,
      title: 'Fill your basket',
      desc: 'Add what you need straight from the farmer who grew it. No middlemen, no markup.',
    },
    {
      icon: <Truck size={24} color={leaf} />,
      title: 'Get it delivered fresh',
      desc: 'Your order goes from the field to your door, usually picked the same day.',
    },
  ];

  const missionFeatures = [
    {
      icon: <ShieldCheck color={leaf} size={30} />,
      title: 'Safe vegetables, verified',
      desc: 'Every listing passes a safety check before it reaches the marketplace — no unlabeled chemical use, no guesswork.',
    },
    {
      icon: <Users color={leaf} size={30} />,
      title: 'Fair trade',
      desc: 'Our marketplace guarantees stable pricing, protecting farmers from market volatility.',
    },
    {
      icon: <Leaf color={leaf} size={30} />,
      title: 'Traceable sourcing',
      desc: 'Every vegetable is linked back to the farm it grew on, so you always know where your food came from.',
    },
  ];

  return (
    <div ref={rootRef} style={{ minHeight: '100vh', backgroundColor: paper, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700;800&display=swap');

        .veg-heading { font-family: 'Fraunces', serif; }

        /* ── Produce-tag signature: a small jagged-edge sticker label,
           used everywhere a generic "uppercase eyebrow" would otherwise go ── */
        .produce-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: ${soil};
          background: ${paper};
          padding: 5px 12px 5px 10px;
          border: 1.5px solid ${soil};
          border-radius: 3px 10px 3px 10px / 10px 3px 10px 3px;
          position: relative;
        }
        .produce-tag::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${carrot};
          flex-shrink: 0;
        }

        /* ── Woven-basket divider, replaces stock-photo section breaks ── */
        .basket-divider {
          height: 14px;
          background-image: repeating-linear-gradient(45deg, ${sprout} 0, ${sprout} 3px, transparent 3px, transparent 9px),
                             repeating-linear-gradient(-45deg, ${leaf} 0, ${leaf} 3px, transparent 3px, transparent 9px);
          background-blend-mode: multiply;
          opacity: 0.35;
          border-radius: 8px;
        }

        .home-stat { text-align: center; }
        .home-stat-value { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 700; color: ${soil}; line-height: 1; }
        .home-stat-label { font-size: 12.5px; font-weight: 600; color: #8a7d6f; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .featured-card { transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid #ece5d8; }
        .featured-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(59,43,32,0.10); }
        .skeleton { background: linear-gradient(90deg, #efe9dc 25%, #f6f2e8 50%, #efe9dc 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .step-card { position: relative; border: 1px solid #ece5d8; }

        /* ── Hero animations — text-entrance only, no illustration to animate ── */
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }

        .hero-underline path { stroke-dasharray: 240; stroke-dashoffset: 240; animation: drawLine 0.9s ease-out 0.7s forwards; }
        .hero-scroll-cue { animation: bounceArrow 1.8s ease-in-out infinite; }

        .hero-fade-1 { animation: riseIn 0.6s ease-out 0.05s both; }
        .hero-fade-2 { animation: riseIn 0.6s ease-out 0.18s both; }
        .hero-fade-3 { animation: riseIn 0.6s ease-out 0.30s both; }
        .hero-fade-4 { animation: riseIn 0.6s ease-out 0.42s both; }
        .hero-fade-5 { animation: riseIn 0.6s ease-out 0.54s both; }

        /* ── Scroll-triggered reveal system ──
           .reveal             : a single block that fades/rises in as a unit
           .reveal-stagger     : a grid/row wrapper whose .reveal-item children
                                  cascade in one after another via nth-child delays
           Both only need the 'in-view' class toggled once by the
           IntersectionObserver in the component — everything else is CSS. */
        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .reveal.in-view { opacity: 1; transform: translateY(0); }

        .reveal-stagger .reveal-item {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .reveal-stagger.in-view .reveal-item { opacity: 1; transform: translateY(0); }
        .reveal-stagger.in-view .reveal-item:nth-child(1) { transition-delay: 0s; }
        .reveal-stagger.in-view .reveal-item:nth-child(2) { transition-delay: 0.09s; }
        .reveal-stagger.in-view .reveal-item:nth-child(3) { transition-delay: 0.18s; }
        .reveal-stagger.in-view .reveal-item:nth-child(4) { transition-delay: 0.27s; }
        .reveal-stagger.in-view .reveal-item:nth-child(5) { transition-delay: 0.36s; }
        .reveal-stagger.in-view .reveal-item:nth-child(6) { transition-delay: 0.45s; }

        /* Number counting up on the live-stats strip */
        .home-stat-value { transition: opacity 0.3s ease; }

        @media (prefers-reduced-motion: reduce) {
          .hero-scroll-cue,
          .hero-fade-1, .hero-fade-2, .hero-fade-3, .hero-fade-4, .hero-fade-5, .hero-underline path,
          .reveal, .reveal-item {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
            stroke-dashoffset: 0 !important;
          }
        }

        .hero-cta-primary { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hero-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(59,43,32,0.22); }
        .hero-cta-primary:hover .hero-cta-arrow { transform: translateX(3px); }
        .hero-cta-arrow { transition: transform 0.2s ease; }
        .hero-cta-secondary { transition: background-color 0.2s ease, border-color 0.2s ease; }
        .hero-cta-secondary:hover { background-color: #fff; border-color: ${soil}; }

        .hero-content { max-width: 760px; margin: 0 auto; text-align: center; }
        .hero-cta-row { justify-content: center; }
        .hero-stats-row { justify-content: center; }

        @media (max-width: 900px) {
          .home-stats-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 20px !important; }
          .home-stat-value { font-size: 28px !important; }
          .featured-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid, .mission-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .cta-banner { flex-direction: column !important; text-align: center !important; }
        }
        @media (max-width: 560px) {
          .hero-headline { font-size: 40px !important; }
          .hero-stats-row { flex-wrap: wrap; row-gap: 16px; }
        }
        @media (max-width: 520px) {
          .featured-grid { grid-template-columns: 1fr !important; }
          .home-section-padding { padding: 40px 24px !important; }
        }
      `}</style>

      {/* ── Hero — full-width text, no illustration ── */}
      <section style={{ position: 'relative', overflow: 'hidden', backgroundColor: paper, padding: '0 0 96px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 5% 0', position: 'relative', zIndex: 1 }}>
          <div className="hero-content">
            <div className="hero-fade-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: `1px solid #e4dccb`, borderRadius: '999px', padding: '8px 16px 8px 12px', fontSize: '13px', fontWeight: '700', color: soil }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: sprout, boxShadow: `0 0 0 3px ${sprout}33` }} />
              Freshly harvested today
            </div>

            <h1 className="veg-heading hero-headline hero-fade-2" style={{ fontSize: '56px', fontWeight: '700', color: soil, lineHeight: '1.1', margin: '24px 0 0' }}>
              Fresh vegetables from{' '}
              <span style={{ position: 'relative', color: leaf, display: 'inline-block' }}>
                local farmers
                <svg className="hero-underline" viewBox="0 0 220 16" width="100%" height="14" style={{ position: 'absolute', left: 0, bottom: '-6px', width: '100%' }} aria-hidden="true">
                  <path d="M2 10 C 50 2, 170 2, 218 9" fill="none" stroke={carrot} strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              , straight to your door
            </h1>

            <p className="hero-fade-3" style={{ fontSize: '17px', color: '#6b6155', lineHeight: '1.7', margin: '26px auto 0', maxWidth: '560px' }}>
              Join our digital marketplace connecting Cambodian farmers directly with you. Fair prices,
              verified-safe vegetables, and delivery that's usually picked the same day.
            </p>

            <div className="hero-fade-4 hero-cta-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '32px 0 0', flexWrap: 'wrap' }}>
              <Link
                href="/shop"
                className="hero-cta-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: soil, color: '#fff', fontWeight: '700', fontSize: '14.5px', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }}
              >
                Shop fresh harvest
                <ArrowRight size={17} className="hero-cta-arrow" />
              </Link>
              <a
                href="#about-us"
                className="hero-cta-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'transparent', color: soil, fontWeight: '700', fontSize: '14.5px', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none', border: `1.5px solid #e4dccb` }}
              >
                Learn more
              </a>
            </div>

            <div className="hero-fade-5 hero-stats-row" style={{ display: 'flex', alignItems: 'center', gap: '28px', margin: '44px 0 0' }}>
              <div>
                <div className="veg-heading" style={{ fontSize: '24px', fontWeight: '700', color: leaf }}>50+</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#8a7d6f', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Vegetables</div>
              </div>
              <div style={{ width: '1px', height: '34px', backgroundColor: '#e4dccb' }} />
              <div>
                <div className="veg-heading" style={{ fontSize: '24px', fontWeight: '700', color: leaf }}>100%</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#8a7d6f', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Safety-checked</div>
              </div>
              <div style={{ width: '1px', height: '34px', backgroundColor: '#e4dccb' }} />
              <div>
                <div className="veg-heading" style={{ fontSize: '24px', fontWeight: '700', color: leaf }}>Fast</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#8a7d6f', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Delivery</div>
              </div>
            </div>
          </div>

          <div className="hero-scroll-cue" style={{ display: 'flex', justifyContent: 'center', marginTop: '56px', color: '#b3a892' }} aria-hidden="true">
            <ChevronDown size={22} />
          </div>
        </div>
      </section>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 5%' }}>

        {/* ── Live Stats Strip ── */}
        <section
          className="reveal"
          style={{
            marginTop: '-40px',
            position: 'relative',
            zIndex: 5,
            backgroundColor: '#fff',
            borderRadius: '20px',
            border: `1px solid #ece5d8`,
            boxShadow: '0 12px 32px rgba(59,43,32,0.06)',
            padding: '32px 40px',
          }}
        >
          <div className="home-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div className="home-stat">
              <div className="home-stat-value">{stats.products}+</div>
              <div className="home-stat-label">Safe vegetables listed</div>
            </div>
            <div className="home-stat" style={{ borderLeft: '1px solid #ece5d8', borderRight: '1px solid #ece5d8' }}>
              <div className="home-stat-value">{stats.farms}</div>
              <div className="home-stat-label">Local farms selling</div>
            </div>
            <div className="home-stat">
              <div className="home-stat-value">{stats.provinces}</div>
              <div className="home-stat-label">Provinces reached</div>
            </div>
          </div>
        </section>

        {/* ── Featured Products ── */}
        <section className="home-section-padding" style={{ padding: '20px 0 60px' }}>
          <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="produce-tag">Just listed</span>
              <h2 className="veg-heading" style={{ fontSize: '32px', fontWeight: '700', color: soil, margin: '12px 0 0' }}>
                Fresh off the farm
              </h2>
            </div>
            <Link
              href="/shop"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: leaf, fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}
            >
              View all vegetables <ArrowRight size={16} />
            </Link>
          </div>

          {loadingFeatured && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <CircularLoader size={42} label="Fetching fresh harvest" />
            </div>
          )}

          <div className="featured-grid reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {loadingFeatured
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="reveal-item" style={{ borderRadius: '18px', overflow: 'hidden', backgroundColor: '#fff', border: '1px solid #ece5d8' }}>
                    <div className="skeleton" style={{ height: '160px' }} />
                    <div style={{ padding: '16px' }}>
                      <div className="skeleton" style={{ height: '12px', width: '60%', borderRadius: '6px', marginBottom: '10px' }} />
                      <div className="skeleton" style={{ height: '16px', width: '80%', borderRadius: '6px' }} />
                    </div>
                  </div>
                ))
              : featured.length === 0
              ? (
                <div className="reveal-item" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 0', color: '#9a8e7f' }}>
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>No vegetables listed yet — check back soon.</p>
                </div>
              )
              : featured.map((product) => (
                <Link
                  key={product.id}
                  href="/shop"
                  className="featured-card reveal-item"
                  style={{ borderRadius: '18px', overflow: 'hidden', backgroundColor: '#fff', textDecoration: 'none', display: 'block' }}
                >
                  <div style={{ height: '160px', backgroundColor: '#f1ede2', overflow: 'hidden' }}>
                    {product.img ? (
                      <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9bfae' }}>
                        <Leaf size={32} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: leaf }}>{product.category}</span>
                    <h4 style={{ margin: '4px 0 6px', fontSize: '15px', fontWeight: '700', color: soil }}>{product.name}</h4>
                    <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: leaf }}>
                      {product.price.toLocaleString()} KHR <span style={{ fontSize: '11px', color: '#9a8e7f', fontWeight: '400' }}>/ {product.unit}</span>
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9a8e7f' }}>{product.shopName}</p>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="home-section-padding" style={{ padding: '50px 0' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span className="produce-tag">How it works</span>
            <h2 className="veg-heading" style={{ fontSize: '32px', fontWeight: '700', color: soil, margin: '14px 0 0' }}>
              From the field to your door
            </h2>
          </div>
          <div className="steps-grid reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {steps.map((step, i) => (
              <div key={i} className="step-card reveal-item" style={{ backgroundColor: '#fff', borderRadius: '18px', padding: '30px 26px' }}>
                <div style={{ backgroundColor: '#eef3ea', width: '58px', height: '58px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  {step.icon}
                </div>
                <h5 className="veg-heading" style={{ fontSize: '18px', fontWeight: '700', color: soil, margin: '0 0 10px' }}>{step.title}</h5>
                <p style={{ fontSize: '14px', color: '#6b6155', lineHeight: '1.6', margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mission: safe vegetables, fair trade, traceable sourcing ── */}
        <section
          id="about-us"
          className="home-section-padding"
          style={{ margin: '50px 0 90px', backgroundColor: '#fff', borderRadius: '24px', padding: '56px', border: '1px solid #ece5d8' }}
        >
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span className="produce-tag">Our mission</span>
            <h2 className="veg-heading" style={{ fontSize: '30px', fontWeight: '700', color: soil, margin: '14px 0 12px' }}>
              Safe vegetables, straight from the source
            </h2>
            <p style={{ color: '#6b6155', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              We bridge the gap between hard-working farmers and your family, ensuring a sustainable future for
              Cambodian agriculture — and a safe vegetable on every table.
            </p>
          </div>
          <div className="mission-grid reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '44px' }}>
            {missionFeatures.map((feature, i) => (
              <div key={i} className="reveal-item" style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ backgroundColor: '#eef3ea', width: '76px', height: '76px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  {feature.icon}
                </div>
                <h5 className="veg-heading" style={{ fontSize: '17px', fontWeight: '700', color: soil, margin: '0 0 10px' }}>{feature.title}</h5>
                <p style={{ fontSize: '14.5px', color: '#6b6155', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA — solid colour, no stock gradient/photo ── */}
        <section
          className="cta-banner reveal"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            backgroundColor: soil,
            borderRadius: '24px',
            padding: '48px 52px',
            marginBottom: '90px',
          }}
        >
          <div style={{ maxWidth: '520px' }}>
            <span className="produce-tag" style={{ background: 'transparent', color: sprout, borderColor: sprout }}>
              Sell with us
            </span>
            <h3 className="veg-heading" style={{ fontSize: '25px', fontWeight: '700', color: '#fff', margin: '14px 0 10px' }}>
              Are you a local farmer?
            </h3>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', margin: 0 }}>
              List your harvest, set your own prices, and reach customers across Cambodia — no middlemen taking a
              cut of your work.
            </p>
          </div>
          <a
            href="#about-us"
            style={{
              flexShrink: 0,
              backgroundColor: carrot,
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
              padding: '15px 28px',
              borderRadius: '10px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Learn more <ArrowRight size={16} />
          </a>
        </section>
      </main>
    </div>
  );
}