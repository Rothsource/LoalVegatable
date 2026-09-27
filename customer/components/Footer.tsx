"use client";

import { Mail, Phone, MapPin, Globe, AtSign, Share2 } from "lucide-react";
import Image from "next/image";

// ── Same design tokens as the homepage ──
const leaf = '#2E6F40';
const sprout = '#6FAE5C';
const paper = '#FBF8F2';
const soil = '#3B2B20';

export default function Footer() {
  return (
    <footer className="footer-root">
      <style>{`
        .footer-veg-heading { font-family: 'Fraunces', serif; }

        .footer-root {
          font-family: 'Inter', sans-serif;
          background: ${soil};
          color: ${paper};
          padding: 80px 6% 0;
          position: relative;
          overflow: hidden;
        }
        .footer-bg-blob {
          position: absolute; top: -100px; right: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(111,174,92,0.10), transparent 70%);
          pointer-events: none;
        }
        .footer-grid {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.4fr;
          gap: 50px;
          padding-bottom: 60px;
          border-bottom: 1px solid rgba(251,248,242,0.1);
        }
        .footer-brand-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 18px;
          text-decoration: none;
        }
        .footer-brand-icon {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .footer-brand-name {
          font-size: 21px; font-weight: 700; color: ${paper};
          letter-spacing: -0.3px;
        }
        .footer-brand-name span { color: ${sprout}; }
        .footer-tagline {
          font-size: 14px; color: rgba(251,248,242,0.6);
          line-height: 1.7; max-width: 260px; margin: 0 0 24px;
        }
        .footer-socials {
          display: flex; gap: 10px;
        }
        .footer-social-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(251,248,242,0.07);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          border: 1px solid rgba(251,248,242,0.1);
          color: rgba(251,248,242,0.65);
          text-decoration: none;
        }
        .footer-social-btn:hover {
          background: ${leaf}; color: ${paper};
          border-color: ${leaf};
          transform: translateY(-2px);
        }
        .footer-col-title {
          font-size: 12px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 1.5px;
          color: ${sprout}; margin: 0 0 20px;
        }
        .footer-links-list {
          display: flex; flex-direction: column; gap: 12px;
          list-style: none; margin: 0; padding: 0;
        }
        .footer-links-list a {
          font-size: 14px; color: rgba(251,248,242,0.6);
          text-decoration: none; transition: color 0.2s;
          font-weight: 500;
        }
        .footer-links-list a:hover { color: ${paper}; }
        .footer-contact-item {
          display: flex; align-items: flex-start; gap: 12px;
          margin-bottom: 16px;
        }
        .footer-contact-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(251,248,242,0.07);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .footer-contact-text {
          font-size: 13px; color: rgba(251,248,242,0.6);
          line-height: 1.5; font-weight: 500;
        }
        .footer-bottom {
          position: relative; z-index: 1;
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 24px 0;
          flex-wrap: wrap; gap: 12px;
        }
        .footer-bottom-text {
          font-size: 13px; color: rgba(251,248,242,0.35); margin: 0;
        }
        .footer-bottom-links {
          display: flex; gap: 24px;
        }
        .footer-bottom-links a {
          font-size: 13px; color: rgba(251,248,242,0.35);
          text-decoration: none; transition: color 0.2s;
        }
        .footer-bottom-links a:hover { color: rgba(251,248,242,0.75); }
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="footer-bg-blob" />

      <div className="footer-grid">
        {/* Brand */}
        <div>
          <a href="/" className="footer-brand-logo">
            <Image src="/image/logo.png" alt="LocalVegetable logo" width={38} height={38} className="footer-brand-icon" />
            <span className="footer-veg-heading footer-brand-name">Local<span>Vegetable</span></span>
          </a>
          <p className="footer-tagline">
            Empowering local Cambodian farmers through fair digital trade. Fresh vegetables, straight to your door.
          </p>
          <div className="footer-socials">
            <a href="#" className="footer-social-btn"><Globe size={16} /></a>
            <a href="#" className="footer-social-btn"><AtSign size={16} /></a>
            <a href="#" className="footer-social-btn"><Share2 size={16} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="footer-col-title">Quick Links</p>
          <ul className="footer-links-list">
            <li><a href="/">Home</a></li>
            <li><a href="/shop">Shop</a></li>
            <li><a href="/cart">Cart</a></li>
            <li><a href="#about-us">About Us</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <p className="footer-col-title">Legal</p>
          <ul className="footer-links-list">
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Shipping Policy</a></li>
            <li><a href="#">FAQs</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="footer-col-title">Contact Us</p>
          <div className="footer-contact-item">
            <div className="footer-contact-icon"><MapPin size={15} color={sprout} /></div>
            <span className="footer-contact-text">Phnom Penh, Cambodia</span>
          </div>
          <div className="footer-contact-item">
            <div className="footer-contact-icon"><Mail size={15} color={sprout} /></div>
            <span className="footer-contact-text">hello@localveg.com</span>
          </div>
          <div className="footer-contact-item">
            <div className="footer-contact-icon"><Phone size={15} color={sprout} /></div>
            <span className="footer-contact-text">+855 12 345 678</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-bottom-text">© {new Date().getFullYear()} LocalVeg. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}