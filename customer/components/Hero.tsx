"use client";

export default function Hero() {
  return (
    <section className="hero">
      {/* Background decorative circles */}
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />

      <div className="hero-content">
        {/* Left: Text */}
        <div className="hero-text">
          <span className="hero-badge">🌱 Fresh from local farms</span>
          <h1 className="hero-title">
            Farm Fresh <br />
            <span className="hero-highlight">Vegetables</span><br />
            Delivered to You
          </h1>
          <p className="hero-sub">
            Order fresh, organic vegetables directly from local farmers.
            Harvested today, on your table tomorrow.
          </p>
          <div className="hero-actions">
            <a href="/shop" className="btn-primary">Shop Now →</a>
            <a href="#categories" className="btn-secondary">Browse Categories</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><strong>50+</strong><span>Vegetables</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>100%</strong><span>Organic</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>Free</strong><span>Delivery</span></div>
          </div>
        </div>

        {/* Right: Image placeholder */}
        <div className="hero-image-wrap">
          <div className="hero-image-placeholder">
            <span className="hero-emoji">🥦</span>
            <p>Product image</p>
          </div>
          <div className="floating-card card-top">
            <span>🥕</span> Just restocked!
          </div>
          <div className="floating-card card-bottom">
            <span>⭐</span> 4.9 Rating
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 88vh;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #f0faf2 0%, #e8f5e9 60%, #c8e6c9 100%);
          overflow: hidden;
          padding: 4rem 2rem;
        }
        .bg-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.25;
        }
        .bg-circle-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #4caf50, transparent);
          top: -120px; right: -100px;
        }
        .bg-circle-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #a8e063, transparent);
          bottom: -80px; left: -60px;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
        }
        .hero-badge {
          display: inline-block;
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 1.25rem;
          letter-spacing: 0.3px;
        }
        .hero-title {
          font-family: 'Georgia', serif;
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          line-height: 1.2;
          color: #1b3a2a;
          margin: 0 0 1rem;
        }
        .hero-highlight {
          color: #2e7d32;
          position: relative;
        }
        .hero-sub {
          font-size: 16px;
          color: #4a7055;
          line-height: 1.7;
          max-width: 420px;
          margin: 0 0 2rem;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }
        .btn-primary {
          background: #2e7d32;
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(46,125,50,0.3);
        }
        .btn-primary:hover { background: #1b5e20; transform: translateY(-2px); }
        .btn-secondary {
          background: white;
          color: #2e7d32;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          border: 1.5px solid #a5d6a7;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: #2e7d32; }
        .hero-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat strong {
          font-size: 20px;
          font-weight: 700;
          color: #1b3a2a;
        }
        .stat span {
          font-size: 12px;
          color: #6a9475;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-divider {
          width: 1px;
          height: 36px;
          background: #a5d6a7;
        }
        .hero-image-wrap {
          position: relative;
          display: flex;
          justify-content: center;
        }
        .hero-image-placeholder {
          width: 340px;
          height: 340px;
          background: linear-gradient(145deg, #c8e6c9, #a5d6a7);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 4px solid white;
          box-shadow: 0 20px 60px rgba(46,125,50,0.2);
        }
        .hero-emoji { font-size: 80px; }
        .hero-image-placeholder p {
          font-size: 13px;
          color: #4a7055;
          font-style: italic;
          margin: 0;
        }
        .floating-card {
          position: absolute;
          background: white;
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #1b3a2a;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .card-top { top: 20px; right: 10px; }
        .card-bottom { bottom: 30px; left: 10px; }
        @media (max-width: 768px) {
          .hero-content { grid-template-columns: 1fr; gap: 2rem; }
          .hero-image-wrap { display: none; }
          .hero { min-height: auto; padding: 3rem 1.5rem; }
        }
      `}</style>
    </section>
  );
}