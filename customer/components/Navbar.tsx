"use client";

import Link from "next/link";
import { ShoppingCart, Bell, Home, Store, Menu, X, Leaf, User, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home", icon: <Home size={15} /> },
    { href: "/shop", label: "Shop", icon: <Store size={15} /> },
    { href: "/cart", label: "Cart", icon: <ShoppingCart size={15} /> },
    { href: "/favorites", label: "Favorites", icon: <Heart size={15} /> },
    { href: "/notifications", label: "Notifications", icon: <Bell size={15} /> },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .nav-root {
          position: sticky; top: 0; z-index: 200;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
        }
        .nav-root.scrolled { box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
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
          background: rgba(13,179,13,0.15);
          font-weight: 700;
          box-shadow: inset 0 -2px 0 #0DB30D;
        }
        .nav-actions {
          display: flex; align-items: center; gap: 10px;
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
        .nav-profile {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 10px;
          background: #fff;
          border: 2px solid #e5e7eb;
          color: #0A490A;
          font-size: 14px; font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
        }
        .nav-profile:hover {
          border-color: #0DB30D;
          background: #f0fdf0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13,179,13,0.12);
        }
        .nav-profile-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #0DB30D, #a8e063);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
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
        .mobile-link:hover { background: rgba(10,73,10,0.05); color: #0A490A; }
        .mobile-link.active {
          background: rgba(13,179,13,0.12);
          color: #0A490A;
          font-weight: 700;
        }
        .mobile-link-profile {
          display: flex; align-items: center; gap: 10px;
          color: #0A490A; text-decoration: none;
          padding: 12px 14px; border-radius: 10px;
          font-size: 15px; font-weight: 700;
          background: #f0fdf0;
          border: 2px solid #d1fae5;
          margin-top: 4px;
          transition: all 0.2s;
        }
        .mobile-link-profile:hover { background: #dcfce7; border-color: #0DB30D; }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-actions { display: none; }
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
            <span className="nav-logo-text">Local<span>Vegetable</span></span>
          </Link>

          {/* Desktop links */}
          <ul className="nav-links">
            {navLinks.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} className={`nav-link${isActive(href) ? " active" : ""}`}>
                  {icon} {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="nav-actions">
            <Link href="/shop" className="nav-cta">
              <ShoppingCart size={15} /> Shop Now
            </Link>
            <Link href="/auth/user-info" className="nav-profile">
              <div className="nav-profile-avatar">
                <User size={14} color="#0A490A" strokeWidth={2.5} />
              </div>
              Profile
            </Link>
          </div>

          {/* Mobile burger */}
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            {navLinks.map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className={`mobile-link${isActive(href) ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}>
                {icon} {label}
              </Link>
            ))}
            <Link href="/auth/user-info" className="mobile-link-profile" onClick={() => setMenuOpen(false)}>
              <div className="nav-profile-avatar">
                <User size={14} color="#0A490A" strokeWidth={2.5} />
              </div>
              Profile
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}