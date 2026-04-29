"use client";

import Link from "next/link";
import { ShoppingCart, Bell, Home, Store, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <span className="logo-leaf">🌿</span>
        <span className="logo-text">LocalVeg</span>
      </div>

      {/* Desktop Nav Links */}
      <ul className="nav-links">
        <li><Link href="/" className="nav-link active"><Home size={16} /> Home</Link></li>
        <li><Link href="/shop" className="nav-link"><Store size={16} /> Shop</Link></li>
        <li><Link href="/cart" className="nav-link"><ShoppingCart size={16} /> Cart</Link></li>
        <li><Link href="/notifications" className="nav-link"><Bell size={16} /> Notification</Link></li>
      </ul>

      {/* Mobile Hamburger */}
      <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link href="/" className="mobile-link" onClick={() => setMenuOpen(false)}><Home size={16} /> Home</Link>
          <Link href="/shop" className="mobile-link" onClick={() => setMenuOpen(false)}><Store size={16} /> Shop</Link>
          <Link href="/cart" className="mobile-link" onClick={() => setMenuOpen(false)}><ShoppingCart size={16} /> Cart</Link>
          <Link href="/notifications" className="mobile-link" onClick={() => setMenuOpen(false)}><Bell size={16} /> Notification</Link>
        </div>
      )}

      <style jsx>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 64px;
          background: #1a3d2b;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-leaf { font-size: 22px; }
        .logo-text {
          font-family: 'Georgia', serif;
          font-size: 20px;
          font-weight: 700;
          color: #a8e063;
          letter-spacing: 0.5px;
        }
        .nav-links {
          display: flex;
          list-style: none;
          gap: 2rem;
          margin: 0;
          padding: 0;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #c8e6c9;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-link:hover, .nav-link.active {
          color: #a8e063;
          background: rgba(168, 224, 99, 0.1);
        }
        .nav-link.active {
          border-bottom: 2px solid #a8e063;
          border-radius: 0;
          background: none;
        }
        .menu-btn {
          display: none;
          background: none;
          border: none;
          color: #c8e6c9;
          cursor: pointer;
          padding: 4px;
        }
        .mobile-menu {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: #1a3d2b;
          display: flex;
          flex-direction: column;
          padding: 1rem 2rem;
          gap: 0.5rem;
          border-top: 1px solid rgba(168,224,99,0.2);
        }
        .mobile-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #c8e6c9;
          text-decoration: none;
          padding: 10px 0;
          font-size: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        @media (max-width: 640px) {
          .nav-links { display: none; }
          .menu-btn { display: block; }
        }
      `}</style>
    </nav>
  );
}