import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Ultra-premium 15-character verification ID generator
const generateCustomId = () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for ( let i = 0; i < 15; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Prefix to ensure visually distinct format if necessary, but purely 15 chars requested
    return result;
};

export default function Checkout() {
  const { cart, cartTotal, clearCart, customPictures, setActiveOrderId } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Delivery charged ONCE per unique product (not multiplied by quantity)
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
        paymentScreenshot: null, // to be populated in Step 2
        customPictures: customPictures || [],
        orderStatus: 'Awaiting Payment',
        createdAt: serverTimestamp()
      };

      // Create early order record using custom 15-char tracker
      const customId = generateCustomId();
      await setDoc(doc(db, 'orders', customId), orderData);
      
      // Save it as the active session draft
      setActiveOrderId(customId);
      
      // Do NOT clear cart yet. Proceed to payment step.
      navigate('/payment', { state: { orderId: customId, grandTotal: grandTotal } });
    } catch (error) {
      console.error("Error processing checkout:", error);
      alert('Failed to initialize booking. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full pt-4 md:pt-10 flex flex-col md:flex-row gap-10 text-rose-950 px-4">
      
      {/* Checkout Form */}
      <div className="flex-1 bg-white/95 border border-white p-8 md:p-12 rounded-[3rem] backdrop-blur-xl shadow-[0_20px_60px_rgba(255,228,230,0.8)] relative overflow-hidden">
        {/* Soft Decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/50 rounded-full mix-blend-multiply filter blur-[80px] -z-10 animate-pulse"></div>
        
        <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 tracking-tight">Secure Finalization</h2>
        <p className="text-rose-800/70 font-medium mb-10">Please enter your shipping destination exactly as recorded.</p>
        
        <form onSubmit={handleCheckout} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-2">Full Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required type="text" className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-6 py-4 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100/50 transition-all font-bold placeholder-rose-300 shadow-inner" placeholder="E.g. Maryam's Custom" />
          </div>
          <div>
            <label className="block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-2">Contact Number</label>
            <input name="phone" value={formData.phone} onChange={handleChange} required type="tel" className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-6 py-4 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100/50 transition-all font-bold placeholder-rose-300 shadow-inner" placeholder="+123 456 7890" />
          </div>
          <div>
            <label className="block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-2">Delivery Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-6 py-4 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100/50 transition-all font-bold placeholder-rose-300 shadow-inner" placeholder="Complete address including ZIP"></textarea>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 sm:p-8 rounded-[2rem] border border-pink-200 shadow-sm mt-8 relative overflow-hidden flex items-center gap-4">
             {/* Overlay pattern or glow */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-200/40 rounded-full blur-[40px]"></div>
             
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm shrink-0 relative z-10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <p className="text-rose-900 font-bold text-sm relative z-10">
               Clicking proceed will securely reserve these items under your details and route you to our verified Payment Gateway.
             </p>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 mt-10 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-[1.5rem] font-black text-xl lg:text-2xl shadow-[0_15px_30px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(244,114,182,0.4)] text-white disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <span className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin"></span>
                Generating Invoice...
              </>
            ) : 'Proceed & Finalize Payment'}
          </button>
        </form>
      </div>

      {/* Order Summary Sidebar */}
      <div className="w-full md:w-96 shrink-0 bg-white/95 border border-white rounded-[3rem] p-10 h-fit sticky top-28 shadow-[0_20px_60px_rgba(255,228,230,0.8)] backdrop-blur-xl">
        <h3 className="text-2xl font-black mb-8 text-rose-950 border-b border-rose-100 pb-4">Order Summary</h3>
        <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-5 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 shadow-sm">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl shadow-sm border border-rose-50" />
              <div className="flex-1">
                <p className="font-bold text-sm text-rose-950 line-clamp-1">{item.name}</p>
                <p className="text-xs text-rose-500 font-medium mt-1">
                  Qty: {item.quantity} 
                  {item.variation && <span className="font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-lg border border-pink-200 ml-2">{item.variation}</span>}
                </p>
                <p className="text-pink-500 font-black mt-2">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-rose-100 pt-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-rose-800/80 font-medium">Subtotal</span>
            <span className="font-bold text-rose-950">Rs. {cartTotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center mb-8">
            <span className="text-rose-800/80 font-medium">Delivery</span>
            {totalDelivery > 0
              ? <span className="font-bold text-amber-600">Rs. {totalDelivery.toFixed(0)}</span>
              : <span className="font-bold text-emerald-500">Free 🎁</span>
            }
          </div>
          <div className="flex justify-between items-center bg-rose-50/50 -mx-10 -mb-10 p-10 border-t border-rose-100 rounded-b-[3rem]">
            <span className="text-xl font-bold text-rose-950">Total</span>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight">Rs. {grandTotal.toFixed(0)}</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
