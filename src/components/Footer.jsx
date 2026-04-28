import React from 'react';
import { Link } from 'react-router-dom';
import sparkleLogo from '../assets/sparkle.jpg';

const WHATSAPP_URL = 'https://wa.me/923238750695';
const INSTAGRAM_URL = 'https://www.instagram.com/_elegent_sparkle_hub_?utm_source=qr&igsh=cWpmaWYwcGFrNGxz';
const FACEBOOK_URL = 'https://www.facebook.com/share/14ervgie2tx/';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto relative overflow-hidden">

      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-50/60 via-white to-rose-50/80 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-300/60 to-transparent" />

      {/* ── Main Body ── */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">

          {/* ── Brand Column ── */}
          <div className="flex flex-col gap-6">

            {/* Logo + Name */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 blur-md opacity-30 scale-110" />
                <img
                  src={sparkleLogo}
                  alt="Sparkle Hub Logo"
                  className="relative w-14 h-14 rounded-full border-2 border-rose-200 object-cover shadow-lg"
                />
              </div>
              <div>
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 tracking-tight leading-none">
                  Sparkle Hub
                </p>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-[3px] mt-1">
                  Handcrafted Resin Art ✨
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-rose-800/60 leading-relaxed font-medium max-w-sm">
              Every piece we craft is made with love, precision, and pure Pakistani passion. Your masterpiece is waiting.
            </p>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-rose-200 via-pink-100 to-transparent w-3/4" />

            {/* Social Buttons */}
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-[3px] mb-4">Find Us On</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:border-emerald-300 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-emerald-100 hover:shadow-md group outline-none"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.513-18.396A11.838 11.838 0 0012.052.011C5.464.011.109 5.365.106 11.954c0 2.103.549 4.156 1.593 5.968L0 24l6.236-1.636a11.868 11.868 0 005.816 1.517h.005c6.587 0 11.942-5.354 11.946-11.943a11.84 11.84 0 00-3.484-8.444z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-5 py-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200/80 hover:border-blue-300 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-blue-100 hover:shadow-md group outline-none"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V7.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-5 py-3 bg-white hover:bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/80 hover:border-fuchsia-300 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-fuchsia-100 hover:shadow-md group outline-none"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  Instagram
                </a>
              </div>
            </div>
          </div>

          {/* ── Support & Legal Column ── */}
          <div className="flex flex-col gap-6 md:pl-8 md:border-l md:border-rose-100/80">

            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-[3px] mb-5">Support & Legal</p>

              <div className="flex flex-col gap-1">
                {[
                  { to: '/privacy-policy',    label: 'Privacy Policy',    emoji: '🔒' },
                  { to: '/terms-of-service',  label: 'Terms of Service',  emoji: '📄' },
                  { to: '/contact',           label: 'Contact Us',        emoji: '💬' },
                ].map(({ to, label, emoji }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50/80 transition-all outline-none"
                  >
                    <span className="w-8 h-8 rounded-xl bg-white border border-rose-100 shadow-sm flex items-center justify-center text-sm shrink-0 group-hover:scale-110 transition-transform">
                      {emoji}
                    </span>
                    <span className="text-sm font-semibold text-rose-800/70 group-hover:text-pink-600 transition-colors">
                      {label}
                    </span>
                    <svg className="w-3.5 h-3.5 ml-auto text-rose-200 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust badge */}
            <div className="mt-2 p-4 bg-white border border-rose-100 rounded-2xl shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 flex items-center justify-center shrink-0 text-lg">
                🇵🇰
              </div>
              <div>
                <p className="text-xs font-black text-rose-800">Proudly Made in Pakistan</p>
                <p className="text-[11px] text-rose-600/60 font-medium mt-0.5 leading-snug">
                  100% handcrafted resin art by skilled artisans. Every order is made with heart.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="relative border-t border-rose-100/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-bold text-rose-400/80 text-center sm:text-left">
            © {currentYear} <span className="font-black text-rose-500">Sparkle Hub</span>. All rights reserved. Handcrafted with Maryam ❤️
          </p>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Secure & Verified Store</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
