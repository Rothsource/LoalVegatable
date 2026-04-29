"use client";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">🌿 LocalVeg</div>
          <p className="footer-tagline">Fresh vegetables, straight from local farms to your doorstep.</p>
        </div>

        {/* Links */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <a href="/">Home</a>
          <a href="/shop">Shop</a>
          <a href="/cart">Cart</a>
          <a href="/notifications">Notifications</a>
        </div>

        {/* Contact */}
        <div className="footer-links">
          <h4>Contact</h4>
          <span>📍 Phnom Penh, Cambodia</span>
          <span>📧 hello@localveg.com</span>
          <span>📞 +855 12 345 678</span>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} LocalVeg. All rights reserved.</p>
      </div>

      <style jsx>{`
        .footer {
          background: #1a3d2b;
          color: #c8e6c9;
          padding: 3rem 2rem 0;
        }
        .footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 3rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid rgba(168,224,99,0.15);
        }
        .footer-logo {
          font-family: 'Georgia', serif;
          font-size: 22px;
          font-weight: 700;
          color: #a8e063;
          margin-bottom: 0.75rem;
        }
        .footer-tagline {
          font-size: 14px;
          color: #81a888;
          line-height: 1.6;
          margin: 0;
          max-width: 260px;
        }
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .footer-links h4 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #a8e063;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }
        .footer-links a, .footer-links span {
          font-size: 14px;
          color: #81a888;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #c8e6c9; }
        .footer-bottom {
          text-align: center;
          padding: 1.25rem;
        }
        .footer-bottom p {
          font-size: 13px;
          color: #4a7055;
          margin: 0;
        }
        @media (max-width: 640px) {
          .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
        }
      `}</style>
    </footer>
  );
}