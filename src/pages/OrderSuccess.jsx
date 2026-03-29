import React, { useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 w-full">
      <div className="bg-white/95 border border-white p-10 md:p-14 rounded-[3rem] text-center backdrop-blur-xl shadow-[0_20px_60px_rgba(255,228,230,0.8)] relative overflow-hidden w-full max-w-2xl animate-fade-in-up">
        
        {/* Soft Decorative Elements */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-200/50 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-rose-200/50 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100 relative z-10">
          <svg className="w-14 h-14 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 tracking-tight drop-shadow-sm relative z-10">
          Masterpiece Secured!
        </h1>
        
        <p className="text-rose-800/80 text-lg mb-8 leading-relaxed font-medium relative z-10">
          Your exquisite order has been successfully placed and is pending verification. 
          We'll begin preparing your resin art the moment your transfer is confirmed.
        </p>
        
        <div className="bg-rose-50/80 p-6 md:p-8 rounded-[2rem] border border-rose-100 mb-10 shadow-inner relative z-10 flex flex-col items-center">
          <p className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-3">Tracking ID</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xl md:text-2xl text-rose-600 font-bold bg-white px-5 py-2.5 rounded-xl border border-rose-100 shadow-sm inline-block tracking-wider">
              {orderId}
            </p>
            <button 
              onClick={handleCopy}
              className="p-3.5 bg-white hover:bg-rose-100 text-rose-500 rounded-xl border border-rose-100 shadow-sm transition-all focus:outline-none active:scale-95 group"
              title="Copy to Clipboard"
            >
              {isCopied ? (
                <span className="text-xl">✅</span>
              ) : (
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-rose-400/80 mt-5 mx-auto max-w-sm">Please save this ID or use your registered email to track your order lifecycle.</p>
        </div>

        <Link to="/" className="inline-block px-12 py-5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-black text-xl shadow-[0_15px_30px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(244,114,182,0.4)] relative z-10 outline-none">
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
