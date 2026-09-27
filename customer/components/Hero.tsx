"use client";

import { ChevronRight, Leaf, Truck } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .hero {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(145deg, #f0faf2 0%, #e6f4e6 50%, #d4edda 100%);
          padding: 90px 6% 100px;
          position: relative;
          overflow: hidden;
        }
        .hero-bg-blob-1 {
          position: absolute; top: -120px; right: -80px;
          width: 520px; height: 520px; border-radius: 50%;
          background: radial-gradient(circle, rgba(13,179,13,0.12), transparent 70%);
          pointer-events: none;
        }
        .hero-bg-blob-2 {
          position: absolute; bottom: -100px; left: -60px;
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(168,224,99,0.15), transparent 70%);
          pointer-events: none;
        }
        .hero-inner {
          position: relative; z-index: 1;
          max-width: 1280px; margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fff;
          border: 1.5px solid #a5d6a7;
          color: #2e7d32;
          border-radius: 100px;
          padding: 7px 16px;
          font-size: 13px; font-weight: 700;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(46,125,50,0.08);
        }
        .hero-badge-dot {
          width: 8px; height: 8px;
          background: #0DB30D; border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-title {
          font-size: clamp(2.4rem, 4.5vw, 3.6rem);
          font-weight: 800;
          color: #0A490A;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 20px;
        }
        .hero-title-accent {
          color: #0DB30D;
          position: relative;
          display: inline-block;
        }
        .hero-title-accent::after {
          content: '';
          position: absolute;
          bottom: 4px; left: 0; right: 0;
          height: 4px; border-radius: 2px;
          background: linear-gradient(90deg, #0DB30D, #a8e063);
          opacity: 0.4;
        }
        .hero-sub {
          font-size: 17px; color: #4a7055;
          line-height: 1.75; max-width: 460px;
          margin: 0 0 36px;
        }
        .hero-actions {
          display: flex; gap: 14px;
          flex-wrap: wrap; margin-bottom: 48px;
          align-items: center;
        }
        .hero-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #0A490A; color: #fff;
          padding: 15px 30px; border-radius: 14px;
          font-size: 15px; font-weight: 700;
          text-decoration: none;
          transition: all 0.25s;
          box-shadow: 0 6px 20px rgba(10,73,10,0.3);
        }
        .hero-btn-primary:hover {
          background: #0DB30D;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(13,179,13,0.35);
        }
        .hero-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fff; color: #0A490A;
          padding: 15px 28px; border-radius: 14px;
          font-size: 15px; font-weight: 700;
          text-decoration: none;
          border: 2px solid #a5d6a7;
          transition: all 0.25s;
        }
        .hero-btn-secondary:hover {
          border-color: #0A490A;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(10,73,10,0.1);
        }
        .hero-stats {
          display: flex; gap: 32px; align-items: center;
        }
        .hero-stat strong {
          display: block;
          font-size: 22px; font-weight: 800; color: #0A490A;
        }
        .hero-stat span {
          font-size: 12px; color: #6a9475;
          font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .hero-divider {
          width: 1px; height: 40px; background: #a5d6a7;
        }
        .hero-image-side {
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-img-frame {
          width: 100%; max-width: 520px;
          height: 460px; border-radius: 32px;
          overflow: hidden; position: relative;
          box-shadow: 0 32px 80px rgba(10,73,10,0.2);
        }
        .hero-img-frame img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .hero-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(10,73,10,0.4));
        }
        .hero-float-card {
          position: absolute;
          background: #fff; border-radius: 16px;
          padding: 14px 18px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
          display: flex; align-items: center; gap: 12px;
        }
        .hero-float-card-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-float-card-label {
          font-size: 11px; color: #999; font-weight: 600; margin-bottom: 2px;
        }
        .hero-float-card-value {
          font-size: 14px; font-weight: 800; color: #111;
        }
        .hero-float-top { top: 24px; left: -24px; }
        .hero-float-bottom { bottom: 32px; right: -24px; }
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; gap: 40px; }
          .hero-image-side { display: none; }
          .hero { padding: 60px 6%; }
        }
      `}</style>

      <div className="hero-bg-blob-1" />
      <div className="hero-bg-blob-2" />

      <div className="hero-inner">
        {/* Left */}
        <div>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Freshly Harvested Today
          </div>

          <h1 className="hero-title">
            Fresh Vegetables<br />
            From <span className="hero-title-accent">Local Farmers</span><br />
            To Your Door
          </h1>

          <p className="hero-sub">
            Join our digital marketplace connecting Cambodian farmers directly with you. Fair prices, Guaranteed freshness, Quick delivery.
          </p>

          <div className="hero-actions">
            <a href="/shop" className="hero-btn-primary">
              Shop Fresh Harvest <ChevronRight size={18} />
            </a>
            <a href="#about-us" className="hero-btn-secondary">
              Learn More
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <strong>50+</strong>
              <span>Vegetables</span>
            </div>
            <div className="hero-divider" />
            <div className="hero-stat">
              <strong>100%</strong>
              <span>Organic</span>
            </div>
            <div className="hero-divider" />
            <div className="hero-stat">
              <strong>Fast</strong>
              <span>Delivery</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="hero-image-side">
          <div className="hero-img-frame">
            <img
              src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1000&q=80"
              alt="Fresh vegetables"
            />
            <div className="hero-img-overlay" />
          </div>

          <div className="hero-float-card hero-float-top">
            <div className="hero-float-card-icon" style={{ background: '#eff6ef' }}>
              <Leaf size={20} color="#0DB30D" />
            </div>
            <div>
              <div className="hero-float-card-label">Today's Pick</div>
              <div className="hero-float-card-value">Morning Glory</div>
            </div>
          </div>

          <div className="hero-float-card hero-float-bottom">
            <div className="hero-float-card-icon" style={{ background: '#fff7ed' }}>
              <Truck size={20} color="#f97316" />
            </div>
            <div>
              <div className="hero-float-card-label">Delivery</div>
              <div className="hero-float-card-value">Right to your door</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
