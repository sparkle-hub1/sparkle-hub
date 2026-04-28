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

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-16 px-4 animate-fade-in-up">

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full text-xs font-black text-rose-500 uppercase tracking-widest mb-6">
          📄 Legal Agreement
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-rose-800/70 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          By placing an order or using <strong>Sparkle Hub</strong>, you agree to the following terms. Please read them carefully before purchasing.
        </p>
        <p className="text-sm text-rose-400 font-bold mt-4">Last Updated: March 2025</p>
      </div>

      <div className="space-y-6">

        <Section icon="🤝" title="Acceptance of Terms">
          <p>By accessing or using the Sparkle Hub platform — whether browsing our catalog, placing an order, creating an account, or uploading custom design references — you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
          <p>If you do not agree with any part of these terms, you must discontinue use of our services immediately. These terms apply to all users including customers, visitors, and guests.</p>
        </Section>

        <Section icon="🧾" title="Order Placement & Payment">
          <p>Sparkle Hub operates on a <strong>manual payment verification model</strong> using Easypaisa. The following rules govern all order transactions:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>All orders require a valid Easypaisa payment before production begins. Your order enters <strong>"Pending"</strong> status upon receipt upload.</Bullet>
            <Bullet>Uploading a fraudulent, edited, or fake payment screenshot is strictly prohibited and will result in immediate order rejection and account suspension.</Bullet>
            <Bullet>Payment must be sent to the designated Sparkle Hub Easypaisa number: <strong>03191388186</strong> (Maryam Noor).</Bullet>
            <Bullet>Orders are not confirmed until a team member manually verifies your uploaded payment receipt. This may take up to <strong>24 hours</strong>.</Bullet>
            <Bullet>Prices listed on Sparkle Hub are in <strong>Pakistani Rupees (PKR)</strong> and include any applicable delivery charges per product.</Bullet>
            <Bullet>We reserve the right to cancel any order at our discretion if payment cannot be verified or if fraudulent activity is suspected.</Bullet>
          </ul>
        </Section>

        <Section icon="🎨" title="Custom & Handcrafted Orders">
          <p>All Sparkle Hub products are <strong>handcrafted from premium resin</strong>. Please understand the nature of artisanal goods:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>Each piece is made to order. Minor variations in color tone, texture, or glitter distribution may occur naturally and are not considered defects.</Bullet>
            <Bullet>Reference images uploaded by customers are used as creative inspiration only. Exact replication of third-party designs is not guaranteed.</Bullet>
            <Bullet>Custom orders with uploaded design references are considered bespoke commissions and are subject to additional review before confirmation.</Bullet>
            <Bullet>Production timelines vary by order complexity. Standard orders are typically ready within <strong>5–10 business days</strong>.</Bullet>
          </ul>
        </Section>

        <Section icon="🔄" title="Cancellations & Refunds">
          <ul className="space-y-2">
            <Bullet><strong>Before Confirmation:</strong> Orders that have not yet been confirmed (payment not yet verified) may be cancelled by contacting us via WhatsApp or Instagram.</Bullet>
            <Bullet><strong>After Confirmation:</strong> Once production has started, cancellations are not accepted as materials have already been committed to your specific order.</Bullet>
            <Bullet><strong>Damaged / Defective Items:</strong> If your order arrives visibly damaged due to poor packaging, please photograph the item immediately and contact us within <strong>48 hours</strong> of delivery. We will investigate and offer a resolution (replacement or partial refund) at our discretion.</Bullet>
            <Bullet><strong>Late Delivery:</strong> Sparkle Hub is not responsible for delays caused by courier partners, weather conditions, remote area inaccessibility, or other circumstances beyond our control.</Bullet>
            <Bullet>Refunds, if approved, will be processed manually via Easypaisa within <strong>5–7 business days</strong>.</Bullet>
          </ul>
        </Section>

        <Section icon="🚚" title="Delivery & Shipping">
          <ul className="space-y-2">
            <Bullet>Delivery charges are set per product and are clearly displayed at checkout before payment. Some products include <strong>free delivery</strong>.</Bullet>
            <Bullet>We currently ship across Pakistan. Delivery timelines vary by city and courier availability.</Bullet>
            <Bullet>Once your order is dispatched, you will receive an email notification with your order status updated to <strong>"Dispatched"</strong>.</Bullet>
            <Bullet>Please ensure your delivery address and phone number are accurate before completing payment. We are not liable for delivery failures due to incorrect address information.</Bullet>
            <Bullet>In the event of a missed delivery, please contact your courier directly using the tracking details provided or reach out to us via WhatsApp.</Bullet>
          </ul>
        </Section>

        <Section icon="🔒" title="Account Responsibilities">
          <ul className="space-y-2">
            <Bullet>You are responsible for maintaining the confidentiality of your Sparkle Hub login credentials. Do not share your password with anyone.</Bullet>
            <Bullet>You must provide accurate personal information when creating an account or placing an order.</Bullet>
            <Bullet>Any activity that occurs under your account is your sole responsibility.</Bullet>
            <Bullet>Sparkle Hub reserves the right to suspend or permanently delete accounts that violate these terms or engage in fraudulent behavior.</Bullet>
          </ul>
        </Section>

        <Section icon="⚖️" title="Intellectual Property">
          <ul className="space-y-2">
            <Bullet>All product images, brand assets, and designs displayed on Sparkle Hub are the exclusive intellectual property of Sparkle Hub and its creators.</Bullet>
            <Bullet>You may not reproduce, distribute, or commercially exploit any content from this platform without written permission.</Bullet>
            <Bullet>Custom reference images submitted by customers remain the property of the submitting customer. Sparkle Hub will not publicly share or use them beyond the scope of your order.</Bullet>
          </ul>
        </Section>

        <Section icon="🚫" title="Prohibited Activities">
          <p>The following activities are strictly prohibited on the Sparkle Hub platform:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>Uploading fake, manipulated, or recycled payment screenshots.</Bullet>
            <Bullet>Creating multiple accounts to exploit offers or manipulate order history.</Bullet>
            <Bullet>Attempting to access, modify, or interfere with the platform's database, authentication systems, or admin panel.</Bullet>
            <Bullet>Using Sparkle Hub for any unlawful purpose or in violation of any applicable laws in Pakistan.</Bullet>
            <Bullet>Harassing, threatening, or abusing Sparkle Hub staff or other customers through any communication channel.</Bullet>
          </ul>
        </Section>

        <Section icon="📝" title="Changes to These Terms">
          <p>Sparkle Hub reserves the right to update these Terms of Service at any time to reflect changes in our operations, legal requirements, or service policies.</p>
          <ul className="space-y-2 mt-3">
            <Bullet>The "Last Updated" date at the top of this page will reflect when changes were made.</Bullet>
            <Bullet>Continued use of our platform after changes are posted constitutes your acceptance of the updated terms.</Bullet>
            <Bullet>We encourage you to review these terms periodically to stay informed of any updates.</Bullet>
          </ul>
        </Section>

        <Section icon="📬" title="Questions About These Terms">
          <p>If you have any questions about these Terms of Service, please reach out to us before making a purchase:</p>
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
