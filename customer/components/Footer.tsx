"use client";

import { Mail, Phone, MapPin, Globe, Clock } from "lucide-react";
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
          grid-template-columns: 2fr 1fr 1fr 1.6fr;
          gap: 48px;
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
          font-size: 14px; color: rgba(251,248,242,0.65);
          line-height: 1.7; max-width: 290px; margin: 0 0 20px;
        }
        .footer-badge-flag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: ${sprout};
          background: rgba(111,174,92,0.12);
          border: 1px solid rgba(111,174,92,0.25);
          border-radius: 999px;
          padding: 4px 12px;
          margin-bottom: 22px;
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
          color: rgba(251,248,242,0.7);
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
        .footer-contact-col {
          display: flex; flex-direction: column; gap: 3px;
        }
        .footer-contact-text {
          font-size: 13px; color: rgba(251,248,242,0.65);
          line-height: 1.5; font-weight: 500;
        }
        .footer-contact-link {
          font-size: 13px; color: rgba(251,248,242,0.75);
          text-decoration: none; transition: color 0.2s;
          font-weight: 500; display: inline-flex; align-items: center; gap: 6px;
        }
        .footer-contact-link:hover { color: ${sprout}; }
        .footer-contact-sub {
          font-size: 11px; color: rgba(251,248,242,0.45);
        }
        .footer-chip {
          font-size: 10px; padding: 1px 6px; border-radius: 4px;
          background: rgba(111,174,92,0.18); color: ${sprout};
          font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .footer-bottom {
          position: relative; z-index: 1;
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 24px 0;
          flex-wrap: wrap; gap: 12px;
        }
        .footer-bottom-text {
          font-size: 13px; color: rgba(251,248,242,0.45); margin: 0;
        }
        .footer-bottom-links {
          display: flex; gap: 24px;
        }
        .footer-bottom-links a {
          font-size: 13px; color: rgba(251,248,242,0.4);
          text-decoration: none; transition: color 0.2s;
        }
        .footer-bottom-links a:hover { color: rgba(251,248,242,0.8); }
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
            Empowering Cambodian farming families through fair direct trade. 100% fresh, locally grown vegetables delivered across Phnom Penh.
          </p>
          <div className="footer-badge-flag">
            <span>🇰🇭</span>
            <span>Proudly Grown in Cambodia</span>
          </div>
          <div className="footer-socials">
            {/* Telegram */}
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-btn"
              title="Telegram Community"
              aria-label="Telegram Community"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-btn"
              title="Facebook Page"
              aria-label="Facebook Page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Website / Portal */}
            <a
              href="/"
              className="footer-social-btn"
              title="LocalVegetable Cambodia"
              aria-label="LocalVegetable Cambodia"
            >
              <Globe size={16} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="footer-col-title">Quick Links</p>
          <ul className="footer-links-list">
            <li><a href="/">Home</a></li>
            <li><a href="/shop">Fresh Market</a></li>
            <li><a href="/cart">My Cart</a></li>
            <li><a href="/favorites">Favorites</a></li>
            <li><a href="/notifications">Order Updates</a></li>
          </ul>
        </div>

        {/* Legal & Care */}
        <div>
          <p className="footer-col-title">Customer Care</p>
          <ul className="footer-links-list">
            <li><a href="#">Delivery Info (Phnom Penh)</a></li>
            <li><a href="#">Farmer Partner Standards</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Help & FAQs</a></li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <p className="footer-col-title">Contact Us</p>
          
          {/* Address */}
          <div className="footer-contact-item">
            <div className="footer-contact-icon"><MapPin size={15} color={sprout} /></div>
            <div className="footer-contact-col">
              <span className="footer-contact-text">
                #45, Street 2004, Sangkat Teuk Thla, Khan Sen Sok, Phnom Penh, Cambodia
              </span>
            </div>
          </div>

          {/* Fake Khmer Phone Numbers */}
          <div className="footer-contact-item">
            <div className="footer-contact-icon"><Phone size={15} color={sprout} /></div>
            <div className="footer-contact-col">
              <a href="tel:+85512890234" className="footer-contact-link">
                +855 (0) 12 890 234 <span className="footer-chip">Cellcard</span>
              </a>
              <a href="tel:+85596789012" className="footer-contact-link">
                +855 (0) 96 789 012 <span className="footer-chip">Smart</span>
              </a>
              <span className="footer-contact-sub">Direct Call & Telegram Support</span>
            </div>
          </div>

          {/* Email */}
          <div className="footer-contact-item">
            <div className="footer-contact-icon"><Mail size={15} color={sprout} /></div>
            <div className="footer-contact-col">
              <a href="mailto:support@localvegetable.kh" className="footer-contact-link">
                support@localvegetable.kh
              </a>
              <span className="footer-contact-sub">Response within 2 hours</span>
            </div>
          </div>

          {/* Hours */}
          <div className="footer-contact-item">
            <div className="footer-contact-icon"><Clock size={15} color={sprout} /></div>
            <div className="footer-contact-col">
              <span className="footer-contact-text">Mon – Sun: 6:30 AM – 8:00 PM</span>
              <span className="footer-contact-sub">Indochina Time (ICT, UTC+7)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-bottom-text">
          © {new Date().getFullYear()} LocalVegetable Cambodia. All rights reserved.
        </p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}