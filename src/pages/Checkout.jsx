import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const generateCustomId = () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for ( let i = 0; i < 15; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export default function Checkout() {
  const { cart, cartTotal, clearCart, customPictures, setActiveOrderId } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const totalDelivery = cart.reduce((sum, item) => sum + (item.deliveryCharge || 0), 0);
  const grandTotal = cartTotal + totalDelivery;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.length === 0) return <Navigate to="/products" replace />;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const orderData = {
        userId: currentUser ? currentUser.uid : 'guest',
        userEmail: currentUser ? currentUser.email : 'guest',
        customerDetails: formData,
        items: cart,
        totalAmount: grandTotal,
        deliveryCharges: totalDelivery,
        paymentScreenshot: null,
        customPictures: customPictures || [],
        orderStatus: 'Awaiting Payment',
        createdAt: serverTimestamp()
      };

      const customId = generateCustomId();
      await setDoc(doc(db, 'orders', customId), orderData);
      setActiveOrderId(customId);
      navigate('/payment', { state: { orderId: customId, grandTotal: grandTotal } });
    } catch (error) {
      console.error("Error processing checkout:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full pt-4 md:pt-10 pb-20 flex flex-col lg:flex-row gap-8 lg:gap-14 text-rose-950 px-4">
      
      {/* Checkout Form */}
      <div className="flex-1 bg-white/95 border border-white p-6 sm:p-14 rounded-[2.5rem] sm:rounded-[4rem] backdrop-blur-xl shadow-[0_30px_70px_rgba(255,228,230,0.6)] relative overflow-hidden order-2 lg:order-1">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/30 rounded-full blur-[80px] -z-10"></div>
        
        <div className="mb-8 sm:mb-14">
          <h2 className="text-[1.8rem] sm:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 tracking-tight leading-tight">Secure Finalization</h2>
          <p className="text-rose-800/60 font-bold uppercase tracking-widest text-[10px] sm:text-sm">Verify your shipping destination</p>
        </div>
        
        <form onSubmit={handleCheckout} className="space-y-6 sm:space-y-8">
          <div>
            <label className="block text-[10px] sm:text-xs font-black text-rose-400 mb-2 uppercase tracking-[0.2em] pl-1">Full Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required type="text" className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-black placeholder-rose-200 shadow-inner" placeholder="E.g. Maryam Noor" />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-black text-rose-400 mb-2 uppercase tracking-[0.2em] pl-1">Contact Number</label>
            <input name="phone" value={formData.phone} onChange={handleChange} required type="tel" className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-black placeholder-rose-200 shadow-inner" placeholder="+923..." />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-black text-rose-400 mb-2 uppercase tracking-[0.2em] pl-1">Delivery Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-black placeholder-rose-200 shadow-inner" placeholder="Complete address..."></textarea>
          </div>

          <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50 shadow-inner flex items-center gap-4">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-400 shadow-sm shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <p className="text-rose-800/70 font-bold text-[10px] sm:text-xs uppercase tracking-widest leading-relaxed">
               Secure reservation will be initiated upon proceeding to payment.
             </p>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 sm:py-7 mt-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-3xl shadow-[0_15px_35px_rgba(244,114,182,0.4)] transition-all transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-3 outline-none"
          >
            {isSubmitting ? <span className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin"></span> : 'Proceed & Finalize ➔'}
          </button>
        </form>
      </div>

      {/* Order Summary Sidebar */}
      <div className="w-full lg:w-96 shrink-0 bg-white/95 border border-white rounded-[2.5rem] p-8 sm:p-12 h-fit lg:sticky lg:top-28 shadow-[0_20px_50px_rgba(255,228,230,0.5)] backdrop-blur-xl order-1 lg:order-2">
        <h3 className="text-xl sm:text-2xl font-black mb-8 text-rose-950 border-b border-rose-100 pb-4 uppercase tracking-widest text-center lg:text-left">Your Order</h3>
        <div className="space-y-4 mb-10 max-h-[30vh] lg:max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-rose-50/30 p-2 sm:p-4 rounded-xl border border-rose-100/30">
              <img src={item.image} alt={item.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl shadow-sm border border-white" />
              <div className="flex-1">
                <p className="font-black text-[10px] sm:text-sm text-rose-950 line-clamp-1">{item.name}</p>
                <p className="text-[8px] sm:text-[11px] text-rose-400 font-bold mt-1">Qty: {item.quantity}</p>
                <p className="text-rose-500 font-black mt-1 text-xs sm:text-base">PKR {(item.price * item.quantity).toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-rose-100 pt-8 space-y-3">
          <div className="flex justify-between items-center bg-rose-50/50 -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-8 sm:p-12 border-t border-rose-100 rounded-b-[2.5rem]">
            <span className="text-xs sm:text-base font-black text-rose-400 uppercase tracking-widest">Total Pay</span>
            <span className="text-2xl sm:text-4xl font-black text-rose-600 tracking-tight">PKR {grandTotal.toFixed(0)}</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
