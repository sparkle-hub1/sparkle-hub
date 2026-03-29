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

  // Edit details state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({ name: '', phone: '', address: '' });

  // If someone manually types /payment without an order
  if (!orderId) return <Navigate to="/cart" replace />;

  useEffect(() => {
    if(!orderId) return;
    const fetchOrder = async () => {
      const docSnap = await getDoc(doc(db, 'orders', orderId));
      if (docSnap.exists() && docSnap.data().customerDetails) {
        setShippingDetails(docSnap.data().customerDetails);
      }
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
      alert('Shipping details updated successfully!');
    } catch(err) {
      console.error(err);
      alert('Failed to update details. Try again.');
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot) {
      alert('Please upload your Easypaisa payment receipt.');
      return;
    }

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

      // Fetch the full order to get customer details for the confirmation email
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const customerName = orderData.customerDetails?.name || 'Valued Customer';
        const customerEmail = orderData.userEmail;
        const totalAmount = orderData.totalAmount || grandTotal;

        if (customerEmail) {
          // Fire-and-forget: don't block navigation if email fails
          sendOrderStatusEmail(customerEmail, customerName, orderId, totalAmount, 'Pending')
            .catch(err => console.warn('Order confirmation email failed (non-critical):', err));
        }
      }

      // Crucial: Only clear the cart AFTER payment is secured based on user input.
      clearCart();
      navigate('/success', { state: { orderId } });
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert('Failed to upload receipt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pt-10 px-4 min-h-[70vh] flex flex-col justify-center animate-fade-in-up mb-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 tracking-tight">Complete Your Transfer</h1>
        <p className="text-rose-800/80 font-medium text-lg">Your cart has been safely reserved under ID: <span className="font-bold text-rose-950 px-2 py-1 bg-rose-50 rounded-md border border-rose-100">#{orderId.slice(-8).toUpperCase()}</span></p>
      </div>

      <div className="bg-white/95 border border-white p-8 md:p-12 rounded-[3rem] backdrop-blur-xl shadow-[0_20px_60px_rgba(255,228,230,0.8)] relative overflow-hidden text-left mx-auto w-full max-w-3xl">
        {/* Soft Decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full mix-blend-multiply filter blur-[80px] -z-10 animate-pulse hidden md:block"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 relative z-10">
          <h3 className="text-2xl font-black text-rose-950 flex items-center gap-3">
            <span className="text-3xl drop-shadow-sm">💎</span> Payment Gateway
          </h3>
          <button 
            type="button"
            onClick={() => setIsEditingDetails(true)} 
            className="text-xs sm:text-sm font-bold bg-white text-rose-600 border border-rose-200 hover:border-pink-300 hover:bg-rose-50 px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 outline-none"
          >
             <span>📝</span> Update Delivery Details
          </button>
        </div>
        
        <p className="text-rose-800/80 text-sm leading-relaxed mb-8 font-medium relative z-10">
          To finalize your masterpiece, please securely transfer exactly <strong className="text-rose-600 text-xl border-b-2 border-pink-400 pb-0.5 inline-block mx-1">Rs. {grandTotal}</strong> via the Easypaisa terminal below. 
          <br/><span className="mt-2 block">Then, immediately upload the digital receipt below to submit the commission!</span>
        </p>

        <form onSubmit={handlePaymentSubmit}>
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch bg-emerald-50/50 p-6 md:p-8 rounded-[2rem] border border-emerald-100 shadow-inner relative z-10 mb-8">
            <div className="w-48 h-48 shrink-0 bg-white rounded-2xl overflow-hidden border border-emerald-200 p-2 shadow-sm relative group cursor-pointer hover:shadow-md transition-shadow">
              <img src={easypaisaQr} alt="Easypaisa QR Code" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Secure Mobile Terminal</p>
              <p className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tight mb-4 select-all">03191388186</p>
              
              <div className="bg-white border border-emerald-200 px-6 py-3 rounded-xl inline-block shadow-sm">
                 <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-0.5">Verified Account Name</p>
                 <p className="text-emerald-900 font-black text-xl">Maryam Noor</p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <label className="block text-xs font-bold text-rose-500 mt-2 mb-3 uppercase tracking-widest">Attach Digital Receipt *</label>
            <input 
              type="file" 
              accept="image/*"
              required
              onChange={(e) => setScreenshot(e.target.files[0])}
              className="w-full bg-rose-50/50 border-2 border-dashed border-rose-200 hover:border-pink-300 rounded-2xl px-6 py-8 text-rose-600 focus:outline-none transition-all cursor-pointer file:mr-6 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-white file:text-pink-600 file:shadow-sm hover:file:shadow-md hover:file:bg-pink-50 shadow-inner" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 mt-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-[1.5rem] font-black text-xl shadow-[0_15px_30px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,185,129,0.4)] text-white disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 active:scale-95 z-10 relative outline-none"
          >
            {isSubmitting ? (
              <>
                <span className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin"></span>
                Verifying Payment Proof...
              </>
            ) : 'Verify Receipt & Complete Booking'}
          </button>
        </form>
      </div>

      {/* Edit Details Modal */}
      {isEditingDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full shadow-[0_20px_60px_rgba(255,228,230,0.9)] relative overflow-hidden border border-rose-100">
             <div className="absolute top-0 right-0 w-40 h-40 bg-pink-100/70 rounded-full filter blur-[50px] -z-10"></div>
             
             <button onClick={() => setIsEditingDetails(false)} className="absolute top-6 right-6 text-rose-400 hover:text-rose-600 hover:bg-rose-50 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all outline-none">✕</button>
             
             <h3 className="text-2xl md:text-3xl font-black text-rose-950 mb-2">Delivery Info</h3>
             <p className="text-sm font-medium text-rose-800/70 mb-8">Make sure your shipping details are entirely accurate before proceeding!</p>
             
             <form onSubmit={handleUpdateDetails} className="space-y-4 relative z-10">
                <div>
                   <label className="block text-[10px] font-black text-rose-400 mb-1.5 uppercase tracking-widest pl-1">Full Name</label>
                   <input required type="text" value={shippingDetails.name} onChange={e => setShippingDetails({...shippingDetails, name: e.target.value})} className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50 text-rose-900 font-bold transition-all shadow-inner" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-rose-400 mb-1.5 uppercase tracking-widest pl-1">Phone Number</label>
                   <input required type="text" value={shippingDetails.phone} onChange={e => setShippingDetails({...shippingDetails, phone: e.target.value})} className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50 text-rose-900 font-bold transition-all shadow-inner" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-rose-400 mb-1.5 uppercase tracking-widest pl-1">Delivery Address</label>
                   <textarea required rows="3" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50 text-rose-900 font-bold transition-all shadow-inner"></textarea>
                </div>
                
                <button type="submit" disabled={isUpdatingDetails} className="w-full mt-6 py-4.5 md:py-5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-[1.25rem] font-black text-lg shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(244,114,182,0.4)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 outline-none">
                   {isUpdatingDetails ? (
                     <>
                       <div className="w-5 h-5 border-3 border-white/50 border-t-white rounded-full animate-spin"></div>
                       Saving...
                     </>
                   ) : 'Save Details'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
