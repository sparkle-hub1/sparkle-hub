import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { sendOrderStatusEmail } from '../utils/emailService';
import easypaisaQr from '../assets/sparkleEasypaisa.png';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const orderId = location.state?.orderId;
  const grandTotal = location.state?.grandTotal || 0;

  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({ name: '', phone: '', address: '' });

  if (!orderId) return <Navigate to="/cart" replace />;

  useEffect(() => {
    if(!orderId) return;
    const fetchOrder = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'orders', orderId));
        if (docSnap.exists() && docSnap.data().customerDetails) {
          setShippingDetails(docSnap.data().customerDetails);
        }
      } catch (err) { console.error(err); }
    };
    fetchOrder();
  }, [orderId]);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setIsUpdatingDetails(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { customerDetails: shippingDetails });
      setIsEditingDetails(false);
    } catch(err) {
      console.error(err);
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('file', screenshot);
      data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Sparkle Hub');
      data.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dygknrscb');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dygknrscb'}/image/upload`,
        { method: 'POST', body: data }
      );
      
      const result = await response.json();
      const screenshotURL = result.secure_url;
      
      if (!screenshotURL) throw new Error("Cloudinary upload failed");

      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentScreenshot: screenshotURL,
        orderStatus: 'Pending'
      });

      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const customerName = orderData.customerDetails?.name || 'Valued Customer';
        const customerEmail = orderData.userEmail;
        const totalAmount = orderData.totalAmount || grandTotal;

        if (customerEmail) {
          sendOrderStatusEmail(customerEmail, customerName, orderId, totalAmount, 'Pending')
            .catch(err => console.warn('Email failed:', err));
        }
      }

      clearCart();
      navigate('/success', { state: { orderId } });
    } catch (error) {
      console.error("Payment submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pt-6 md:pt-16 pb-20 px-4 min-h-[85vh] flex flex-col justify-center">
      
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-4xl sm:text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 tracking-tight leading-none">Verify Payment</h1>
        <p className="text-rose-800/60 font-bold uppercase tracking-widest text-[10px] sm:text-sm">Order Reference: <span className="text-rose-950 font-black">#{orderId.slice(-8).toUpperCase()}</span></p>
      </div>

      <div className="bg-white/95 border border-white p-6 sm:p-14 rounded-[2.5rem] sm:rounded-[4rem] backdrop-blur-xl shadow-[0_30px_90px_rgba(255,228,230,0.8)] relative overflow-hidden mx-auto w-full max-w-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-[70px] -z-10 animate-pulse"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <span className="text-xs sm:text-sm font-black text-rose-400 uppercase tracking-widest">Secured Gateway</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsEditingDetails(true)} 
            className="text-[10px] sm:text-xs font-black bg-rose-50 text-rose-600 border border-rose-100 hover:border-pink-300 hover:bg-white px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 uppercase tracking-widest outline-none"
          >
             Update Delivery Info
          </button>
        </div>
        
        <div className="bg-rose-50/40 p-4 sm:p-8 rounded-[2rem] border border-rose-100/50 shadow-inner mb-8 sm:mb-12">
          <p className="text-rose-800/70 text-xs sm:text-base font-medium leading-relaxed text-center sm:text-left">
            Please transfer the amount below via Easypaisa, then upload the screenshot for verification.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-1">
             <span className="text-[10px] sm:text-xs font-black text-rose-400 uppercase tracking-widest">Amount Payable</span>
             <span className="text-3xl sm:text-6xl font-black text-rose-950 tracking-tight">PKR {grandTotal}</span>
          </div>
        </div>

        <form onSubmit={handlePaymentSubmit} className="space-y-8 sm:space-y-10">
          <div className="flex flex-col sm:flex-row gap-8 items-center bg-emerald-50/30 p-6 sm:p-10 rounded-[2.5rem] border border-emerald-100/50 shadow-sm relative z-10">
            <div className="w-40 h-40 sm:w-56 sm:h-56 shrink-0 bg-white rounded-3xl overflow-hidden border-2 border-emerald-200 p-2 shadow-inner group">
              <img src={easypaisaQr} alt="Easypaisa QR" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000" />
            </div>
            
            <div className="text-center sm:text-left flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Easypaisa Number</p>
                <p className="text-2xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tighter select-all">03191388186</p>
              </div>
              <div>
                <span className="text-[8px] sm:text-xs font-black text-emerald-600 bg-white border border-emerald-200 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                   A/C: Maryam Noor
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <label className="block text-[10px] sm:text-xs font-black text-rose-400 mb-3 uppercase tracking-widest pl-2">Evidence of Payment (Screenshot)</label>
            <input 
              type="file" 
              accept="image/*"
              required
              onChange={(e) => setScreenshot(e.target.files[0])}
              className="w-full bg-rose-50/30 border-2 border-dashed border-rose-100 rounded-[1.5rem] sm:rounded-3xl px-4 sm:px-8 py-8 sm:py-12 text-rose-400 font-bold transition-all cursor-pointer file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-rose-500 file:text-white file:uppercase file:tracking-widest shadow-inner hover:border-pink-300" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 sm:py-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl sm:rounded-[2.5rem] font-black text-lg sm:text-3xl shadow-[0_15px_35px_rgba(16,185,129,0.4)] transition-all transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-3 relative z-10"
          >
            {isSubmitting ? <span className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin"></span> : 'Submit & Finish ✨'}
          </button>
        </form>
      </div>

      {/* Edit Details Modal */}
      {isEditingDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rose-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-lg w-full shadow-2xl relative overflow-hidden border-4 border-rose-50">
             <div className="absolute top-0 right-0 w-40 h-40 bg-pink-50 rounded-full blur-[60px] -z-10"></div>
             
             <button onClick={() => setIsEditingDetails(false)} className="absolute top-8 right-8 text-rose-300 hover:text-rose-500 transition-colors font-black text-xl outline-none">✕</button>
             
             <h3 className="text-2xl sm:text-4xl font-black text-rose-950 mb-8 tracking-tighter">Edit Delivery</h3>
             
             <form onSubmit={handleUpdateDetails} className="space-y-6">
                <div>
                   <label className="block text-[10px] font-black text-rose-400 mb-2 uppercase tracking-widest pl-2">Receiver Name</label>
                   <input required type="text" value={shippingDetails.name} onChange={e => setShippingDetails({...shippingDetails, name: e.target.value})} className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:border-pink-300 text-rose-900 font-black transition-all shadow-inner" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-rose-400 mb-2 uppercase tracking-widest pl-2">Phone Number</label>
                   <input required type="text" value={shippingDetails.phone} onChange={e => setShippingDetails({...shippingDetails, phone: e.target.value})} className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:border-pink-300 text-rose-900 font-black transition-all shadow-inner" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-rose-400 mb-2 uppercase tracking-widest pl-2">Shipping Address</label>
                   <textarea required rows="3" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:border-pink-300 text-rose-900 font-black transition-all shadow-inner"></textarea>
                </div>
                
                <button type="submit" disabled={isUpdatingDetails} className="w-full mt-4 py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 outline-none">
                   {isUpdatingDetails ? <span className="w-5 h-5 border-4 border-white/50 border-t-white rounded-full animate-spin"></span> : 'Update Info ✍️'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
