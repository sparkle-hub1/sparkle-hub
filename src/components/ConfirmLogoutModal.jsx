import React from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmLogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-rose-950/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white/95 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(244,114,182,0.3)] w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100 animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-rose-100">
            <span className="text-4xl">🚪</span>
          </div>
          
          <h2 className="text-2xl font-black text-rose-950 mb-2">Leaving so soon?</h2>
          <p className="text-rose-600/80 font-medium mb-8">
            Are you sure you want to log out of your account? You will need to log back in to access your dashboard.
          </p>

          <div className="flex flex-col sm:flex-row w-full gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 rounded-2xl font-bold text-rose-600 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-2xl font-bold text-white shadow-[0_10px_20px_rgba(244,114,182,0.3)] hover:shadow-[0_15px_30px_rgba(244,114,182,0.4)] transition-all flex items-center justify-center gap-2"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
