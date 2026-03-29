import React from 'react';

export default function ConfirmActionModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', confirmColor = 'red' }) {
  if (!isOpen) return null;

  const colorStyles = {
    red: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_5px_15px_rgba(239,68,68,0.4)]',
    rose: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white shadow-[0_5px_15px_rgba(244,63,94,0.4)]'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-rose-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-[0_20px_60px_rgba(255,228,230,0.6)] w-full max-w-sm relative z-10 animate-fade-in-up overflow-hidden">
        {/* Top Accent */}
        <div className={`h-2 w-full ${confirmColor === 'red' ? 'bg-red-400' : 'bg-gradient-to-r from-pink-400 to-rose-400'}`}></div>
        
        <div className="p-8 text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner ${confirmColor === 'red' ? 'bg-red-50 text-red-500' : 'bg-rose-50 text-rose-500'}`}>
            <span className="text-3xl">⚠️</span>
          </div>
          
          <h3 className="text-2xl font-black text-rose-950 mb-3">{title}</h3>
          <p className="text-rose-800/80 font-medium leading-relaxed mb-8">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl font-bold transition-all outline-none"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all outline-none ${colorStyles[confirmColor] || colorStyles.red}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
