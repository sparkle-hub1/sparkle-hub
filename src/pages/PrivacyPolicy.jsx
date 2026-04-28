import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ icon, title, children }) => (
  <div className="bg-white/90 border border-rose-100 rounded-[2rem] p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4 mb-5">
      <div className="w-11 h-11 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-rose-100">
        {icon}
      </div>
      <h2 className="text-xl font-black text-rose-950">{title}</h2>
    </div>
    <div className="text-rose-800/80 leading-relaxed space-y-3 text-[15px]">{children}</div>
  </div>
);

const Bullet = ({ children }) => (
  <li className="flex items-start gap-2.5">
    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
    <span>{children}</span>
  </li>
);

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-16 px-4 animate-fade-in-up">

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full text-xs font-black text-rose-500 uppercase tracking-widest mb-6">
          🔒 Legal & Transparency
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-rose-800/70 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          At <strong>Sparkle Hub</strong>, your privacy is not just a policy — it is a promise. This document explains clearly and transparently how we handle your personal information.
        </p>
        <p className="text-sm text-rose-400 font-bold mt-4">Last Updated: March 2025</p>
      </div>

      <div className="space-y-6">

        <Section icon="📋" title="Information We Collect">
          <p>When you use Sparkle Hub, we collect only the information that is absolutely necessary to fulfill your order and deliver the best possible experience:</p>
          <ul className="space-y-2 mt-3">
            <Bullet><strong>Full Name</strong> — used to personalize your order and address your shipment correctly.</Bullet>
            <Bullet><strong>Email Address</strong> — used for account creation, OTP verification, and sending order status updates.</Bullet>
            <Bullet><strong>Phone Number</strong> — used by our courier partners to coordinate delivery when needed.</Bullet>
            <Bullet><strong>Delivery Address</strong> — used solely to dispatch your handcrafted resin order to the correct location.</Bullet>
            <Bullet><strong>Payment Screenshot</strong> — uploaded by you to verify your Easypaisa transaction. It is used exclusively for payment confirmation by our team.</Bullet>
            <Bullet><strong>Reference / Design Images</strong> — uploaded optionally by you to guide our resin artists in crafting your custom piece.</Bullet>
          </ul>
        </Section>

        <Section icon="🛡️" title="How We Use Your Information">
          <p>Every piece of data we collect has a clear and limited purpose:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>To process, confirm, and fulfill your resin art orders end-to-end.</Bullet>
            <Bullet>To send you automated order lifecycle notifications (Pending → Confirmed → Dispatched → Delivered) via email.</Bullet>
            <Bullet>To verify your identity and account via OTP-based email confirmation.</Bullet>
            <Bullet>To allow our team to contact you for delivery coordination or order-related clarifications.</Bullet>
            <Bullet>To maintain accurate internal records for order management and customer support purposes.</Bullet>
            <Bullet>We do <strong>NOT</strong> use your data for unsolicited marketing, profiling, or any purpose outside of your direct order lifecycle.</Bullet>
          </ul>
        </Section>

        <Section icon="🔐" title="Data Security">
          <p>We take the security of your personal data very seriously and implement industry-standard measures to protect it:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>All user accounts and data are secured through <strong>Firebase Authentication</strong> with encrypted credentials.</Bullet>
            <Bullet>Images (payment receipts & reference photos) are stored on <strong>Cloudinary</strong>, a certified and secure cloud media platform with SSL encryption in transit.</Bullet>
            <Bullet>Our database (<strong>Cloud Firestore</strong>) enforces strict access-control rules so that only you and authorized admin accounts can access your order data.</Bullet>
            <Bullet>We use HTTPS for all data transmission between your device and our servers — your data is always encrypted in transit.</Bullet>
            <Bullet>Passwords are never stored in plain text. Firebase handles all authentication with industry-grade hashing.</Bullet>
          </ul>
        </Section>

        <Section icon="🤝" title="Data Sharing & Third Parties">
          <p>We believe your data belongs to you. We do not sell, rent, or trade your personal information. The only third parties involved are essential service providers:</p>
          <ul className="space-y-2 mt-3">
            <Bullet><strong>Firebase (Google)</strong> — provides our secure database, authentication, and real-time backend infrastructure.</Bullet>
            <Bullet><strong>Cloudinary</strong> — securely stores your uploaded images (payment proofs and reference pictures).</Bullet>
            <Bullet><strong>EmailJS</strong> — sends transactional emails to your inbox such as OTP codes and order status updates.</Bullet>
            <Bullet>All third-party providers are bound by their own strict privacy and security standards.</Bullet>
            <Bullet>We never share your data with advertising networks, data brokers, or any other unauthorized entities.</Bullet>
          </ul>
        </Section>

        <Section icon="🍪" title="Cookies & Local Storage">
          <ul className="space-y-2">
            <Bullet>We use <strong>browser local storage</strong> to save your shopping cart and session data so your experience is seamless across page reloads.</Bullet>
            <Bullet>No third-party advertising or tracking cookies are used on this platform.</Bullet>
            <Bullet>You may clear your browser's local storage at any time to remove this data from your device.</Bullet>
          </ul>
        </Section>

        <Section icon="👤" title="Your Rights">
          <p>As a Sparkle Hub customer, you have the following rights regarding your personal data:</p>
          <ul className="space-y-2 mt-3">
            <Bullet><strong>Right to Access</strong> — You can request a summary of the personal data we hold about you at any time.</Bullet>
            <Bullet><strong>Right to Correction</strong> — You can update your delivery details at any point during the order process via your Profile or the Payment page.</Bullet>
            <Bullet><strong>Right to Deletion</strong> — You can request that your account and associated data be deleted by contacting us directly.</Bullet>
            <Bullet><strong>Right to Withdraw Consent</strong> — You may stop using our services at any time. Existing order data will be retained for the minimum duration required for order fulfillment.</Bullet>
          </ul>
        </Section>

        <Section icon="🔄" title="Policy Updates">
          <p>We may update this Privacy Policy from time to time as our services evolve. When material changes are made:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>The "Last Updated" date at the top of this page will be revised accordingly.</Bullet>
            <Bullet>For significant changes, we will notify registered users via email where appropriate.</Bullet>
            <Bullet>Continued use of Sparkle Hub after changes are published constitutes acceptance of the updated policy.</Bullet>
          </ul>
        </Section>

        <Section icon="📬" title="Contact Regarding Privacy">
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please reach out to us:</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <a
              href="https://wa.me/923238750695"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl font-bold text-sm transition-all hover:shadow-sm outline-none"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.513-18.396A11.838 11.838 0 0012.052.011C5.464.011.109 5.365.106 11.954c0 2.103.549 4.156 1.593 5.968L0 24l6.236-1.636a11.868 11.868 0 005.816 1.517h.005c6.587 0 11.942-5.354 11.946-11.943a11.84 11.84 0 00-3.484-8.444z"/></svg>
              WhatsApp Us
            </a>
            <a
              href="https://www.facebook.com/share/14ervgie2tx/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-bold text-sm transition-all hover:shadow-sm outline-none"
            >
              Message on Facebook
            </a>
            <a
              href="https://www.instagram.com/_elegent_sparkle_hub_?utm_source=qr&igsh=cWpmaWYwcGFrNGxz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-pink-50 hover:to-pink-100 text-fuchsia-700 border border-fuchsia-200 rounded-2xl font-bold text-sm transition-all hover:shadow-sm outline-none"
            >
              DM on Instagram
            </a>
          </div>
        </Section>

      </div>

      <div className="mt-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-rose-400 hover:text-rose-600 transition-colors">
          ← Back to Sparkle Hub
        </Link>
      </div>
    </div>
  );
}
