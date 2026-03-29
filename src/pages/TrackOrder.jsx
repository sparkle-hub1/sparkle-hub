import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';

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
        setError("We couldn't find an order with that ID. Please check the ID and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while tracking your order. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Awaiting Payment': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Confirmed': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Packed': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'Dispatched': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pt-10 md:pt-20 px-4 min-h-[75vh] flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-rose-400">Track Your Masterpiece</h1>
        <p className="text-rose-800/80 text-lg max-w-xl mx-auto font-medium">Enter your secure Order ID below to view the live craftsmanship updates on your pieces.</p>
      </div>

      <div className="bg-white/95 border border-white rounded-[3rem] p-8 md:p-14 backdrop-blur-xl shadow-[0_20px_60px_rgba(255,228,230,0.8)] relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-200/50 rounded-full filter blur-[80px] pointer-events-none animate-pulse"></div>

        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-6 relative z-10 w-full max-w-3xl mx-auto border-b border-rose-100 pb-12 mb-12">
          <input 
            type="text" 
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. jksd8923njkfdf89"
            required
            className="flex-1 bg-rose-50/50 border border-rose-200 rounded-2xl px-6 py-5 text-xl text-rose-900 font-mono focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100/50 transition-all font-bold placeholder-rose-300 shadow-inner"
          />
          <button 
            type="submit"
            disabled={loading}
            className="px-12 py-5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-2xl font-black text-xl text-white shadow-[0_15px_30px_rgba(244,114,182,0.3)] hover:shadow-[0_20px_40px_rgba(244,114,182,0.4)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:scale-100 flex items-center justify-center min-w-[200px]"
          >
            {loading ? (
               <span className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></span>
            ) : "Track Now"}
          </button>
        </form>

        {error && (
          <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-center font-bold shadow-sm animate-fade-in-up relative z-10">
            {error}
          </div>
        )}

        {order && (
          <div className="animate-fade-in-up max-w-4xl mx-auto relative z-10">
            {/* Tracking Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Status for Order</p>
                <p className="font-mono text-2xl text-rose-950 font-black tracking-tight drop-shadow-sm">{order.id}</p>
              </div>
              <div className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl border ${getStatusColor(order.orderStatus)} shadow-sm flex items-center gap-3 backdrop-blur-md`}>
                <span className="text-sm font-black uppercase tracking-widest">{order.orderStatus || 'Pending'}</span>
              </div>
            </div>

            {/* Visual Tracking Pipeline */}
            <div className="bg-rose-50/50 p-6 md:p-10 rounded-[2rem] border border-rose-100 shadow-inner mb-10">
              {order.orderStatus === 'Awaiting Payment' ? (
                <div className="w-full bg-white p-8 rounded-2xl border border-yellow-200 shadow-sm text-center flex flex-col items-center animate-fade-in-up relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100/50 rounded-full mix-blend-multiply blur-[40px]"></div>
                  <span className="text-5xl mb-4 relative z-10 animate-bounce">⏳</span>
                  <h4 className="text-yellow-700 font-black text-2xl mb-2 relative z-10">Payment Pending</h4>
                  <p className="text-rose-800/80 font-medium text-base mb-6 max-w-lg relative z-10">Your commission is currently reserved, but we are awaiting your transaction proof to begin crafting.</p>
                  
                  <button 
                    onClick={() => navigate('/payment', { state: { orderId: order.id, grandTotal: order.totalAmount } })}
                    className="relative z-10 px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-2xl font-black shadow-md hover:shadow-lg transition-transform hover:-translate-y-1 transform outline-none"
                  >
                    Complete Your Payment Now
                  </button>
                </div>
              ) : order.orderStatus === 'Rejected' ? (
                <div className="w-full bg-white p-6 rounded-2xl border border-red-200 shadow-sm text-center flex flex-col items-center animate-fade-in-up">
                  <span className="text-5xl mb-3">❌</span>
                  <h4 className="text-red-700 font-black text-2xl mb-1">Order Rejected</h4>
                  <p className="text-rose-800 font-medium text-sm max-w-md">This order has been cancelled or rejected due to verification failure or other issues.</p>
                  <p className="text-red-500 text-xs mt-3 font-bold uppercase tracking-widest">Please contact support via whatsapp for assistance</p>
                </div>
              ) : (
                <div className="w-full pt-4 md:pt-6 pb-2 px-2 sm:px-4 md:px-8 relative animate-fade-in-up">
                  <div className="flex justify-between relative">
                    {/* Background Line */}
                    <div className="absolute top-4 md:top-5 left-[10%] right-[10%] h-1 bg-rose-200/50 -translate-y-1/2 rounded-full z-0"></div>
                    
                    {/* Progress Line */}
                    <div 
                      className="absolute top-4 md:top-5 left-[10%] h-1 transition-all duration-1000 ease-in-out bg-gradient-to-r from-pink-400 to-rose-500 -translate-y-1/2 rounded-full z-0 shadow-sm"
                      style={{ 
                        width: `${(['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'].indexOf(order.orderStatus) / 4) * 80}%` 
                      }}
                    ></div>
                    
                    {/* Nodes */}
                    {['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'].map((step, idx) => {
                        const currentIndex = ['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'].indexOf(order.orderStatus);
                        const isCompleted = idx <= currentIndex;
                        const isActive = idx === currentIndex;
                        
                        return (
                          <div key={idx} className="relative z-10 flex flex-col items-center group w-14 sm:w-20 md:w-24">
                            <div className={`
                              w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-base transition-all duration-500 shadow-sm border-4
                              ${isCompleted 
                                  ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white border-white scale-110 shadow-md ring-4 ring-rose-100' 
                                  : 'bg-white border-rose-100 text-rose-300'
                              }
                            `}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <p className={`
                              text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center mt-3 md:mt-4 transition-colors duration-500
                              ${isCompleted ? 'text-rose-700 drop-shadow-sm' : 'text-rose-400/70'}
                            `}>
                              {step}
                            </p>
                            
                            {/* Active Pulse Glow */}
                            {isActive && (
                                <div className="absolute top-0 w-8 h-8 md:w-10 md:h-10 bg-rose-400 rounded-full mix-blend-multiply opacity-50 animate-ping z-[-1]"></div>
                            )}
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-rose-100 rounded-[2rem] p-8 shadow-sm">
                 <h4 className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
                   Destination
                   <div className="h-px flex-1 bg-gradient-to-r from-rose-100 to-transparent"></div>
                 </h4>
                 <p className="font-black text-rose-950 text-xl">{order.customerDetails?.name}</p>
                 <p className="text-rose-600 font-bold mt-2">{order.userEmail}</p>
                 <p className="text-rose-600 font-medium mt-1">{order.customerDetails?.phone}</p>
                 <p className="text-rose-800/80 mt-4 leading-relaxed font-medium bg-rose-50 p-4 rounded-xl border border-rose-100/50">{order.customerDetails?.address}</p>
                 <p className="text-rose-400 mt-6 text-xs font-bold uppercase tracking-widest">Commissioned: {order.date}</p>
              </div>

              <div className="bg-white border border-rose-100 rounded-[2rem] p-8 shadow-sm flex flex-col">
                 <h4 className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
                   Masterpieces
                   <div className="h-px flex-1 bg-gradient-to-r from-rose-100 to-transparent"></div>
                 </h4>
                 <div className="flex-1 overflow-y-auto max-h-56 space-y-4 pr-2 mb-6 custom-scrollbar">
                   {order.items?.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center group bg-rose-50/50 p-3 rounded-2xl border border-rose-50 shadow-sm transition-all hover:bg-rose-50 hover:shadow-md">
                       <div className="flex items-center gap-4">
                         <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-white shadow-sm transition-transform group-hover:scale-105" />
                         <div>
                           <p className="text-sm font-bold text-rose-950 line-clamp-1">{item.name}</p>
                           <p className="text-xs text-rose-500 font-bold">Qty: {item.quantity}</p>
                         </div>
                       </div>
                       <p className="text-lg font-black text-pink-500">${(item.price * item.quantity).toFixed(2)}</p>
                     </div>
                   ))}
                 </div>
                 <div className="pt-6 border-t border-rose-100 flex justify-between items-center mt-auto bg-rose-50 -mx-8 -mb-8 px-8 py-6 rounded-b-[2rem]">
                   <h4 className="text-sm text-rose-500 font-black uppercase tracking-widest">Grand Total</h4>
                   <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 drop-shadow-sm">
                     PKR {order.totalAmount?.toFixed(0) || 0}
                   </p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center mt-12 mb-8">
        <Link to="/products" className="text-rose-500 hover:text-pink-600 font-bold tracking-wide uppercase text-sm border-b-2 border-rose-200 hover:border-pink-400 pb-1 transition-all">← Back to Shop</Link>
      </div>
    </div>
  );
}
