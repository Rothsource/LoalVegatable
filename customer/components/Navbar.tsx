"use client";

import Link from "next/link";
import { ShoppingCart, Bell, Home, Store, Menu, X, Leaf } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home", icon: <Home size={15} /> },
    { href: "/shop", label: "Shop", icon: <Store size={15} /> },
    { href: "/cart", label: "Cart", icon: <ShoppingCart size={15} /> },
    { href: "/notifications", label: "Notifications", icon: <Bell size={15} /> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .nav-root {
          position: sticky; top: 0; z-index: 200;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
        }
        .nav-root.scrolled {
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .nav-inner {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 6%; height: 68px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #0DB30D, #a8e063);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-text {
          font-size: 19px; font-weight: 800;
          color: #0A490A; letter-spacing: -0.5px;
        }
        .nav-logo-text span { color: #0DB30D; }
        .nav-links {
          display: flex; align-items: center; gap: 4px;
          list-style: none; margin: 0; padding: 0;
        }
        .nav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          color: #555; text-decoration: none;
          font-size: 14px; font-weight: 600;
          transition: all 0.2s;
        }
        .nav-link:hover {
          color: #0A490A;
          background: rgba(10,73,10,0.06);
        }
        .nav-link.active {
          color: #0A490A;
          background: rgba(13,179,13,0.1);
        }
        .nav-cta {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 20px; border-radius: 10px;
          background: #0A490A; color: #fff;
          font-size: 14px; font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          border: none; cursor: pointer;
        }
        .nav-cta:hover {
          background: #0DB30D;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13,179,13,0.35);
        }
        .menu-btn {
          display: none; background: none; border: none;
          color: #0A490A; cursor: pointer; padding: 6px;
          border-radius: 8px;
        }
        .menu-btn:hover { background: rgba(10,73,10,0.06); }
        .mobile-menu {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(0,0,0,0.06);
          padding: 12px 6%;
          display: flex; flex-direction: column; gap: 4px;
        }
        .mobile-link {
          display: flex; align-items: center; gap: 10px;
          color: #555; text-decoration: none;
          padding: 12px 14px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          transition: all 0.2s;
        }
        .mobile-link:hover {
          background: rgba(10,73,10,0.05); color: #0A490A;
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-cta { display: none; }
          .menu-btn { display: flex; align-items: center; justify-content: center; }
        }
      `}</style>

      <nav className={`nav-root${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <Leaf size={18} color="#0A490A" strokeWidth={2.5} />
            </div>
            <span className="nav-logo-text">Local<span>Veg</span></span>
          </Link>

          {/* Desktop links */}
          <ul className="nav-links">
            {navLinks.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} className="nav-link">
                  {icon} {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link href="/shop" className="nav-cta">
            <ShoppingCart size={15} /> Shop Now
          </Link>

          {/* Mobile burger */}
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            {navLinks.map(({ href, label, icon }) => (
              <Link key={href} href={href} className="mobile-link" onClick={() => setMenuOpen(false)}>
                {icon} {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}