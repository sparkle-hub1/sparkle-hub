import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';

export default function Cart() {
  const { cart, cartTotal, updateQuantity, removeItem, customPictures, addCustomPicture, removeCustomPicture, activeOrderId } = useCart();
  const [itemToRemove, setItemToRemove] = useState(null);
  const [pictureToRemoveIndex, setPictureToRemoveIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Delivery charged ONCE per unique product
  const totalDelivery = cart.reduce((sum, item) => sum + (item.deliveryCharge || 0), 0);
  const grandTotal = cartTotal + totalDelivery;
  const navigate = useNavigate();

  const handleCheckoutNavigation = async () => {
    if (activeOrderId) {
       setIsUpdatingOrder(true);
       try {
         const orderRef = doc(db, 'orders', activeOrderId);
         await updateDoc(orderRef, {
            items: cart,
            totalAmount: grandTotal,
            deliveryCharges: totalDelivery,
            customPictures: customPictures || []
         });
         navigate('/payment', { state: { orderId: activeOrderId, grandTotal: grandTotal } });
       } catch (error) {
         console.error("Failed to sync active order:", error);
       } finally {
         setIsUpdatingOrder(false);
       }
    } else {
       navigate('/checkout');
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (customPictures.length >= 5) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Sparkle Hub');
      data.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dygknrscb');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dygknrscb'}/image/upload`,
        { method: 'POST', body: data }
      );
      const result = await response.json();
      if (result.secure_url) {
        addCustomPicture(result.secure_url);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-fade-in-up">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6 sm:mb-8 shadow-inner border border-rose-200">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mb-3 text-rose-950">Your cart is empty</h2>
        <p className="text-rose-800/60 mb-8 max-w-xs sm:max-w-md font-medium text-sm sm:text-base italic">"Beauty is in the eye of the holder, but your cart has nothing to hold yet."</p>
        <Link to="/products" className="px-10 py-4 bg-rose-500 text-white rounded-full font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-95">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full pt-6 md:pt-14 pb-20 px-4 text-rose-950">
      <SEO 
        title="Your Cart" 
        description="View and manage your selected resin art pieces in your Sparkle Hub shopping cart."
      />
      <div className="flex flex-col mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight leading-none">Your Cart</h1>
        <p className="text-rose-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm mt-2">{cart.length} Masterpieces selected</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 sm:gap-14">
        <div className="flex-1 space-y-4 sm:space-y-6">
          {cart.map(item => (
            <div key={item.id} className="bg-white/95 border border-white rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-7 backdrop-blur-md flex items-center gap-4 sm:gap-8 shadow-[0_10px_30px_rgba(255,228,230,0.3)] relative group overflow-hidden">
              <div className="w-20 h-20 sm:w-40 sm:h-40 shrink-0 bg-rose-50 rounded-xl sm:rounded-3xl overflow-hidden border border-rose-100 shadow-inner">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
              </div>
              
              <div className="flex-1 flex flex-col justify-between h-full py-1">
                <div>
                  <h3 className="text-sm sm:text-2xl font-black text-rose-950 line-clamp-1 leading-tight mb-1 sm:mb-2">{item.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-2 sm:mb-4">
                    <span className="text-[8px] sm:text-[11px] font-black text-rose-500 bg-rose-50 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full border border-rose-100 uppercase tracking-widest">
                       {item.variation || 'Standard'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center bg-rose-50/50 rounded-lg sm:rounded-2xl border border-rose-100 p-0.5 sm:p-1.5 shadow-inner">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center text-rose-500 hover:bg-white rounded-md sm:rounded-xl font-bold transition-all shadow-sm active:scale-90"
                    >—</button>
                    <span className="w-6 sm:w-12 text-center font-black text-xs sm:text-xl text-rose-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center text-rose-500 hover:bg-white rounded-md sm:rounded-xl font-bold transition-all shadow-sm active:scale-90"
                    >+</button>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[10px] sm:text-xs font-black text-rose-300 uppercase tracking-widest mb-0.5 sm:mb-1">Subtotal</p>
                    <p className="text-sm sm:text-2xl font-black text-rose-600">PKR {(item.price * item.quantity).toFixed(0)}</p>
                    <button 
                      onClick={() => setItemToRemove(item)}
                      className="mt-2 text-rose-400 hover:text-red-500 text-[8px] sm:text-xs font-black uppercase tracking-widest underline transition-colors outline-none"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Custom Picture Uploads Section */}
          <div className="mt-8 bg-rose-50/40 p-5 sm:p-10 rounded-[1.8rem] sm:rounded-[3.5rem] border border-rose-100/50 shadow-inner relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/30 rounded-full blur-[40px]"></div>
             <h3 className="text-lg sm:text-2xl font-black text-rose-950 mb-1 sm:mb-2">Custom Design?</h3>
             <p className="text-[10px] sm:text-sm font-bold text-rose-800/60 mb-6 uppercase tracking-widest">Attach up to 5 reference photos (Optional)</p>
             
             <div className="flex flex-wrap gap-3 sm:gap-6 items-center">
                {customPictures.map((pic, idx) => (
                  <div key={idx} className="relative group w-16 h-16 sm:w-28 sm:h-28 rounded-xl sm:rounded-[1.5rem] overflow-hidden shadow-md border-2 border-white shrink-0 animate-fade-in">
                    <img src={pic} alt="Custom Ref" className="w-full h-full object-cover" />
                    <button onClick={() => setPictureToRemoveIndex(idx)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm outline-none">
                      <svg className="w-6 h-6 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                
                {customPictures.length < 5 && (
                  <label className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl sm:rounded-[1.5rem] border-2 border-dashed border-rose-200 flex flex-col items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-white hover:border-pink-300 transition-all cursor-pointer relative overflow-hidden shadow-sm outline-none shrink-0 bg-white/40 active:scale-95">
                    {isUploading ? (
                       <div className="w-5 h-5 sm:w-8 sm:h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                       <>
                         <span className="text-xl sm:text-3xl font-black">+</span>
                         <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 sm:mt-1">Add Image</span>
                       </>
                    )}
                    <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" disabled={isUploading} />
                  </label>
                )}
             </div>
          </div>
        </div>
        
        {/* Summary Card */}
        <div className="w-full lg:w-[400px] shrink-0 h-fit lg:sticky lg:top-28 bg-white/95 border border-white rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(255,228,230,0.6)] backdrop-blur-xl">
          <h3 className="text-xl sm:text-2xl font-black mb-8 text-rose-950 border-b border-rose-100 pb-4">Order Summary</h3>
          
          <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center">
              <span className="text-rose-500 font-bold uppercase tracking-widest text-xs">Items ({cart.length})</span>
              <span className="font-black text-rose-950 sm:text-xl">PKR {cartTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rose-500 font-bold uppercase tracking-widest text-xs">Fragile Delivery</span>
              {totalDelivery > 0
                ? <span className="font-black text-amber-600 sm:text-xl">PKR {totalDelivery.toFixed(0)}</span>
                : <span className="font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full text-xs">FREE 🎁</span>
              }
            </div>
          </div>
          
          <div className="bg-rose-50/50 -mx-6 sm:-mx-10 px-6 sm:px-10 py-6 sm:py-8 mb-8 border-y border-rose-100">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-black text-rose-400 uppercase tracking-widest">Grand Total</span>
              <span className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 drop-shadow-sm">PKR {grandTotal.toFixed(0)}</span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckoutNavigation}
            disabled={isUpdatingOrder}
            className="w-full py-5 sm:py-7 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-2xl sm:rounded-[2rem] font-black text-xl sm:text-2xl shadow-[0_15px_35px_rgba(244,114,182,0.4)] transition-all transform hover:-translate-y-1 outline-none disabled:opacity-50 flex justify-center items-center gap-3"
          >
            {isUpdatingOrder ? (
               <>
                 <span className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin"></span>
                 Syncing...
               </>
            ) : activeOrderId ? (
               <>Confirm & Pay <span className="text-2xl">➔</span></>
            ) : (
               <>Secure Checkout <span className="text-2xl">🔒</span></>
            )}
          </button>
          
          <p className="text-center text-[9px] sm:text-xs font-bold text-rose-300 mt-6 uppercase tracking-widest">Handcrafted with love in Pakistan 🇵🇰</p>
        </div>
      </div>

      <ConfirmActionModal 
        isOpen={itemToRemove !== null}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => removeItem(itemToRemove?.id)}
        title="Remove Item?"
        message={`Are you sure you want to remove this masterpiece?`}
        confirmText="Yes, Remove"
        confirmColor="rose"
      />

      <ConfirmActionModal 
        isOpen={pictureToRemoveIndex !== null}
        onClose={() => setPictureToRemoveIndex(null)}
        onConfirm={() => {
          removeCustomPicture(pictureToRemoveIndex);
          setPictureToRemoveIndex(null);
        }}
        title="Remove Picture?"
        message="Are you sure you want to remove this attached picture?"
        confirmText="Yes, Remove"
        confirmColor="rose"
      />
    </div>
  );
}
