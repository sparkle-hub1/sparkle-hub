import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const WHATSAPP_URL = 'https://wa.me/923238750695';
const INSTAGRAM_URL = 'https://www.instagram.com/elegent_sparkle_hub_?igsh=Y3Jud2poZ2c5bWow';

const InfoCard = ({ icon, label, value, sub }) => (
  <div className="bg-white/90 border border-rose-100 rounded-[2rem] p-7 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col gap-2">
    <div className="text-3xl mb-1">{icon}</div>
    <p className="text-[10px] font-black text-rose-400 uppercase tracking-[2px]">{label}</p>
    <p className="text-lg font-black text-rose-950">{value}</p>
    {sub && <p className="text-sm text-rose-700/70 font-medium">{sub}</p>}
  </div>
);

const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/90 border border-rose-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-7 py-5 text-left outline-none group"
      >
        <span className="text-[15px] font-bold text-rose-950 group-hover:text-pink-600 transition-colors pr-4">{question}</span>
        <span className={`text-rose-400 text-xl font-black shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-7 pb-6 text-sm text-rose-800/80 leading-relaxed font-medium border-t border-rose-50">
          <p className="pt-4">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-16 px-4 animate-fade-in-up">

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full text-xs font-black text-rose-500 uppercase tracking-widest mb-6">
          💬 We're Here For You
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight mb-4">
          Contact Us
        </h1>
        <p className="text-rose-800/70 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          Have a question, a custom order request, or just want to say hello? We'd love to hear from you. Our team is always ready to help.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        <InfoCard
          icon="📱"
          label="WhatsApp"
          value="+92 323 875 0695"
          sub="Available Mon–Sat, 10am–8pm PKT"
        />
        <InfoCard
          icon="📸"
          label="Instagram"
          value="@elegent_sparkle_hub_"
          sub="DM us for custom orders & collabs"
        />
        <InfoCard
          icon="✉️"
          label="Email"
          value="sparkle.hub.admin@gmail.com"
          sub="Best for formal queries & order receipts"
        />
        <InfoCard
          icon="🕐"
          label="Response Time"
          value="Within 24 Hours"
          sub="Usually much faster on WhatsApp"
        />
        <InfoCard
          icon="📦"
          label="Order Queries"
          value="Order ID Required"
          sub="Keep your Tracking ID handy when contacting"
        />
      </div>

      {/* CTA Buttons */}
      <div className="bg-white/90 border border-rose-100 rounded-[2rem] p-8 md:p-10 shadow-sm mb-8">
        <h2 className="text-2xl font-black text-rose-950 mb-2">Reach Out Directly</h2>
        <p className="text-rose-800/70 text-sm font-medium leading-relaxed mb-8">
          The fastest way to get help is via WhatsApp or Instagram. For formal queries you can also email us directly. We reply to every message personally.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1 outline-none"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.513-18.396A11.838 11.838 0 0012.052.011C5.464.011.109 5.365.106 11.954c0 2.103.549 4.156 1.593 5.968L0 24l6.236-1.636a11.868 11.868 0 005.816 1.517h.005c6.587 0 11.942-5.354 11.946-11.943a11.84 11.84 0 00-3.484-8.444z"/>
            </svg>
            Chat on WhatsApp
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 flex-1 py-5 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_25px_rgba(217,70,239,0.3)] hover:shadow-[0_15px_35px_rgba(217,70,239,0.4)] transition-all transform hover:-translate-y-1 outline-none"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            DM on Instagram
          </a>
          <a
            href="mailto:sparkle.hub.admin@gmail.com"
            className="flex items-center justify-center gap-3 flex-1 py-5 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 hover:border-pink-300 rounded-2xl font-black text-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 outline-none"
          >
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Send an Email
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-rose-950 mb-6 flex items-center gap-3">
          <span>❓</span> Frequently Asked Questions
          <div className="h-px flex-1 bg-gradient-to-r from-rose-200 to-transparent" />
        </h2>
        <div className="space-y-3">
          <FaqItem
            question="How do I track my order?"
            answer="Once your order is confirmed and dispatched, you will receive automatic email updates at each stage. You can also log in to your Profile page on Sparkle Hub and view your full order history and current status in real time."
          />
          <FaqItem
            question="How long does it take to receive my order?"
            answer="After payment confirmation, standard resin orders typically take 5–10 business days to handcraft. Custom or complex orders may take additional time. Once dispatched, courier delivery usually takes 2–4 business days depending on your location in Pakistan."
          />
          <FaqItem
            question="Can I change my delivery address after placing an order?"
            answer="Yes! You can update your delivery address on the Payment page before submitting your receipt, or contact us directly on WhatsApp as soon as possible. Once your order is dispatched, we unfortunately cannot change the delivery address."
          />
          <FaqItem
            question="What if my order arrives damaged?"
            answer="We package every order with care; however, if your item arrives damaged due to transit, please take clear photos and contact us within 48 hours of delivery via WhatsApp. We will investigate and offer a suitable resolution such as a replacement or partial refund."
          />
          <FaqItem
            question="Can I place a fully custom order?"
            answer="Absolutely! Sparkle Hub loves custom commissions. Simply upload your reference images during checkout, or reach out to us via WhatsApp or Instagram BEFORE placing an order so we can confirm feasibility, timeline, and pricing for your unique piece."
          />
          <FaqItem
            question="What payment methods do you accept?"
            answer="Currently, we accept payments exclusively via Easypaisa. You will need to transfer the exact order total to our Easypaisa number (03191388186 – Maryam Noor) and upload a screenshot of the transaction receipt on the Payment page."
          />
          <FaqItem
            question="Is my payment information safe?"
            answer="Yes, completely. Your payment screenshot is uploaded directly to Cloudinary — a certified secure cloud storage platform — and is accessible only to our admin team for verification purposes. We never store your Easypaisa PIN or any banking credentials."
          />
          <FaqItem
            question="Can I cancel my order?"
            answer="Yes, but only before the order is marked as Confirmed. Once our team has verified your payment and begun production, the order cannot be cancelled as materials have already been allocated to your commission. Please contact us immediately via WhatsApp if you wish to cancel a pending order."
          />
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white/90 border border-rose-100 rounded-[2rem] p-8 shadow-sm mb-8">
        <h2 className="text-xl font-black text-rose-950 mb-5 flex items-center gap-3"><span>🕐</span> Business Hours</h2>
        <div className="space-y-3">
          {[
            { day: 'Monday – Friday', hours: '10:00 AM – 8:00 PM', status: 'open' },
            { day: 'Saturday', hours: '11:00 AM – 6:00 PM', status: 'open' },
            { day: 'Sunday', hours: 'Closed', status: 'closed' },
            { day: 'Public Holidays', hours: 'May vary — check Instagram', status: 'holiday' },
          ].map(({ day, hours, status }) => (
            <div key={day} className="flex items-center justify-between py-3 border-b border-rose-50 last:border-0">
              <span className="text-sm font-bold text-rose-800">{day}</span>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${
                status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                status === 'closed' ? 'bg-red-50 text-red-500 border border-red-100' :
                'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>{hours}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-rose-400 font-bold mt-4">
          All times are in Pakistan Standard Time (PKT, UTC+5). WhatsApp is often monitored outside these hours too!
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-rose-400 hover:text-rose-600 transition-colors">
          ← Back to Sparkle Hub
        </Link>
      </div>
    </div>
  );
}
