import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function TrackOrder() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError('');
    setOrder(null);
    
    try {
      const docRef = doc(db, 'orders', orderId.trim());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrder({
          id: docSnap.id,
          ...data,
          date: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : 'Unknown Date'
        });
      } else {
        setError("Invalid Order ID. Please check the ID provided in your confirmation email.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Awaiting Payment': return 'bg-yellow-50 text-yellow-600 border-yellow-200 shadow-yellow-100';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-200 shadow-amber-100';
      case 'Confirmed': return 'bg-blue-50 text-blue-600 border-blue-200 shadow-blue-100';
      case 'Packed': return 'bg-purple-50 text-purple-600 border-purple-200 shadow-purple-100';
      case 'Dispatched': return 'bg-teal-50 text-teal-600 border-teal-200 shadow-teal-100';
      case 'Delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200 shadow-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pt-6 md:pt-16 pb-20 px-4 min-h-[85vh] flex flex-col items-center">
      
      {/* Search Section */}
      {!order && (
        <div className="w-full max-w-2xl text-center space-y-10 animate-fade-in-up mt-10 md:mt-20">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-rose-400 leading-none">Track Order</h1>
            <p className="text-rose-800/60 text-sm sm:text-xl font-bold uppercase tracking-widest leading-relaxed">Enter your secure Order ID to trace your resin masterpiece.</p>
          </div>

          <div className="bg-white/95 border border-white rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-14 backdrop-blur-xl shadow-[0_30px_70px_rgba(255,228,230,0.8)] relative overflow-hidden group">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-100/50 rounded-full blur-[80px] pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
            
            <form onSubmit={handleTrack} className="flex flex-col gap-4 sm:gap-6 relative z-10">
              <input 
                type="text" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order ID (e.g. ab12...)"
                required
                className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl sm:rounded-3xl px-6 py-4 sm:py-6 text-sm sm:text-2xl text-rose-950 font-mono focus:outline-none focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all font-black placeholder-rose-200 shadow-inner text-center"
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 sm:py-7 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-3xl shadow-xl hover:shadow-2xl transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
              >
                {loading ? <span className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin"></span> : "Trace Now ✨"}
              </button>
            </form>

            {error && (
              <p className="mt-8 text-red-500 font-black text-xs sm:text-sm uppercase tracking-widest bg-red-50 py-3 rounded-xl border border-red-100 animate-shake">
                ⚠️ {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result Section */}
      {order && (
        <div className="animate-fade-in-up w-full max-w-4xl space-y-8 mt-4">
          <button onClick={() => setOrder(null)} className="flex items-center gap-2 text-rose-400 font-black uppercase tracking-widest text-[10px] sm:text-xs mb-4 hover:text-pink-500 transition-colors group">
            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> New Search
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-rose-100 pb-8">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-black text-rose-400 uppercase tracking-widest">Order Reference</p>
              <h2 className="font-mono text-xl sm:text-4xl text-rose-950 font-black tracking-tight">{order.id}</h2>
            </div>
            <div className={`px-5 py-2.5 rounded-full border-2 ${getStatusColor(order.orderStatus)} shadow-sm`}>
              <span className="text-xs sm:text-lg font-black uppercase tracking-tighter sm:tracking-widest">{order.orderStatus || 'Pending'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Visual Status Line */}
            <div className="lg:col-span-4 bg-white border border-rose-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl"></div>
                <h3 className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] mb-10 relative z-10 text-center sm:text-left">Live Status</h3>
                
                <div className="flex flex-col gap-10 relative z-10 w-full max-w-[240px] mx-auto sm:mx-0">
                  {['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'].map((step, idx) => {
                    const currentIndex = ['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'].indexOf(order.orderStatus);
                    const isCompleted = idx <= currentIndex;
                    const isActive = idx === currentIndex;
                    
                    return (
                      <div key={idx} className="flex items-center gap-6 group relative">
                        {/* Vertical line connector */}
                        {idx !== 4 && (
                          <div className={`absolute top-10 left-5 w-1 h-10 -translate-x-1/2 rounded-full transition-colors duration-1000 ${isCompleted && idx < currentIndex ? 'bg-gradient-to-b from-rose-500 to-rose-300' : 'bg-rose-50'}`}></div>
                        )}
                        
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 transition-all duration-700 shadow-md ${isCompleted ? 'bg-rose-500 border-white text-white scale-110' : 'bg-white border-rose-50 text-rose-200'}`}>
                           {isCompleted ? '✓' : idx + 1}
                           {isActive && <div className="absolute inset-0 w-10 h-10 bg-rose-500 rounded-full animate-ping opacity-30"></div>}
                        </div>
                        
                        <div className="flex flex-col">
                           <span className={`text-xs sm:text-sm font-black uppercase transition-all duration-700 ${isCompleted ? 'text-rose-950 tracking-widest' : 'text-rose-300 tracking-normal'}`}>
                             {step}
                           </span>
                           {isActive && <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter opacity-80 mt-0.5">Currently here</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>

            {/* Right Col: Details */}
            <div className="lg:col-span-8 space-y-8">
              {/* Payment Prompt if awaiting */}
              {order.orderStatus === 'Awaiting Payment' && (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-3xl animate-pulse flex flex-col items-center text-center">
                  <span className="text-3xl mb-2">⏳</span>
                  <h4 className="text-yellow-700 font-black text-lg">Action Required: Payment</h4>
                  <p className="text-rose-800 font-medium text-xs sm:text-sm mt-1 max-w-sm">We are awaiting your payment proof to begin crafting your centerpiece.</p>
                  <button onClick={() => navigate('/payment', { state: { orderId: order.id, grandTotal: order.totalAmount } })} className="mt-4 px-6 py-2.5 bg-yellow-400 text-white font-black rounded-xl text-sm shadow-sm active:scale-95 outline-none">Complete Now 🚀</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-rose-50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                   <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-4">Destination</p>
                   <p className="font-black text-rose-950 text-lg sm:text-xl leading-tight mb-2">{order.customerDetails?.name}</p>
                   <p className="text-rose-800/80 font-medium text-xs sm:text-sm leading-relaxed bg-rose-50/50 p-4 rounded-2xl border border-rose-100">{order.customerDetails?.address}</p>
                   <p className="mt-6 text-[10px] font-black text-rose-300 uppercase tracking-widest">Ordered On: {order.date}</p>
                </div>

                <div className="bg-white border border-rose-50 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl"></div>
                   <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-4 relative z-10">Economics</p>
                   <div className="space-y-4 pt-1 flex-1 relative z-10 mb-4 h-32 overflow-y-auto custom-scrollbar">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="font-black text-rose-950/70">{item.name} × {item.quantity}</span>
                          <span className="font-black text-rose-950">PKR {(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                   </div>
                   <div className="border-t border-rose-100 pt-6 flex justify-between items-center relative z-10 mt-auto">
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Total Paid</span>
                     <span className="text-2xl sm:text-3xl font-black text-rose-600">PKR {order.totalAmount?.toFixed(0) || 0}</span>
                   </div>
                </div>
              </div>

              <div className="bg-rose-50 border border-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                <div className="text-center sm:text-left">
                   <p className="text-rose-900 font-black text-lg sm:text-xl mb-1">Join the family!</p>
                   <p className="text-rose-800/60 font-bold text-xs sm:text-sm">Tag us in your stories when you receive it.</p>
                </div>
                <a href="https://www.instagram.com/elegent_sparkle_hub_?igsh=Y3Jud2poZ2c5bWow" target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-white border border-rose-200 text-rose-600 font-black rounded-2xl text-xs sm:text-sm shadow-sm hover:shadow-md transition-all active:scale-95 outline-none uppercase tracking-widest">Follow Now 📸</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
