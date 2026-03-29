import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Cart() {
  const { cart, cartTotal, updateQuantity, removeItem, customPictures, addCustomPicture, removeCustomPicture, activeOrderId } = useCart();
  const [itemToRemove, setItemToRemove] = useState(null);
  const [pictureToRemoveIndex, setPictureToRemoveIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Delivery charged ONCE per unique product (not multiplied by quantity)
  const totalDelivery = cart.reduce((sum, item) => sum + (item.deliveryCharge || 0), 0);
  const grandTotal = cartTotal + totalDelivery;
  const navigate = useNavigate();

  const handleCheckoutNavigation = async () => {
    // If they already have an active unpaid draft, update it and skip checkout details!
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
         alert("Failed to sync your cart with your draft. Please try again.");
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

    if (customPictures.length >= 5) {
      alert("You can only upload up to 5 pictures per order.");
      return;
    }

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
      alert("Failed to upload picture. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-8 shadow-inner border border-rose-200">
          <svg className="w-12 h-12 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold mb-4 text-rose-950">Your cart is beautifully empty</h2>
        <p className="text-rose-800/70 mb-8 max-w-md">Looks like you haven't added any elegant resin pieces to your cart yet.</p>
        <Link to="/products" className="px-10 py-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-full font-bold text-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full pt-10 px-4 text-rose-950">
      <h1 className="text-4xl md:text-5xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight">Your Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-6">
          {cart.map(item => (
            <div key={item.id} className="bg-white/90 border border-rose-100 rounded-3xl p-4 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <img src={item.image} alt={item.name} className="w-full sm:w-32 h-32 object-cover rounded-2xl border border-rose-50" />
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-rose-950 mb-2">{item.name}</h3>
                <p className="text-pink-600 text-sm font-bold mb-4 bg-pink-50 inline-block px-3 py-1.5 rounded-xl border border-pink-100 shadow-sm">
                  {item.variation ? `Variant: ${item.variation}` : 'Standard Edition'}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center bg-rose-50 rounded-xl border border-rose-100 p-1 shadow-inner">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-white rounded-lg font-bold transition-colors shadow-sm"
                    >-</button>
                    <span className="w-10 text-center font-bold text-rose-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-white rounded-lg font-bold transition-colors shadow-sm"
                    >+</button>
                  </div>
                  <button 
                    onClick={() => setItemToRemove(item)}
                    className="text-rose-400 hover:text-red-500 text-sm font-bold underline transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              <div className="text-2xl font-black text-rose-500 sm:items-end">
                PKR {(item.price * item.quantity).toFixed(0)}
              </div>
            </div>
          ))}

          {/* Custom Picture Uploads Section */}
          <div className="mt-8 bg-rose-50/50 p-6 md:p-8 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden">
             <h3 className="text-xl font-black text-rose-950 mb-2">Have a specific design?</h3>
             <p className="text-sm font-medium text-rose-800/80 mb-6">Attach pictures for our resin artists (Max 5 items. Optional.)</p>
             
             <div className="flex flex-wrap gap-4 items-center">
                {customPictures.map((pic, idx) => (
                  <div key={idx} className="relative group w-24 h-24 rounded-2xl overflow-hidden shadow-inner border border-white shrink-0">
                    <img src={pic} alt="Custom Ref" className="w-full h-full object-cover" />
                    <button onClick={() => setPictureToRemoveIndex(idx)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm outline-none">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                
                {customPictures.length < 5 && (
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-rose-300 flex flex-col items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-white hover:border-pink-400 transition-all cursor-pointer relative overflow-hidden shadow-sm outline-none shrink-0 bg-white/50">
                    {isUploading ? (
                       <div className="w-6 h-6 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                       <>
                         <span className="text-2xl mt-1">+</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Upload</span>
                       </>
                    )}
                    <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" disabled={isUploading} />
                  </label>
                )}
             </div>
          </div>

          {/* Continue Shopping Button */}
          <div className="pt-6">
            <Link to="/products" className="group inline-flex items-center gap-3 px-8 py-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-pink-300 rounded-2xl font-black text-rose-700 shadow-sm transition-all hover:shadow-md outline-none">
              <span className="text-2xl group-hover:-translate-x-2 transition-transform">&larr;</span> 
              Continue Shopping
            </Link>
          </div>
        </div>
        
        <div className="w-full lg:w-96 shrink-0 h-fit sticky top-28 bg-white/90 border border-rose-100 rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(255,228,230,0.5)] backdrop-blur-xl">
          <h3 className="text-xl font-black mb-6 text-rose-900 border-b border-rose-100 pb-4">Order Summary</h3>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-rose-800">
              <span className="font-medium">Subtotal ({cart.length} items)</span>
              <span className="font-bold">PKR {cartTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-800">
              <span className="font-medium">Delivery Charges</span>
              {totalDelivery > 0
                ? <span className="font-bold text-amber-600">PKR {totalDelivery.toFixed(0)}</span>
                : <span className="font-bold text-emerald-500">Free 🎁</span>
              }
            </div>
          </div>
          <div className="border-t border-rose-100 pt-6 mb-8 flex items-center justify-between">
            <span className="text-lg font-black text-rose-950">Grand Total</span>
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">PKR {grandTotal.toFixed(0)}</span>
          </div>
          <button 
            onClick={handleCheckoutNavigation}
            disabled={isUpdatingOrder}
            className="w-full py-5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-black text-xl shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(244,114,182,0.4)] outline-none disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isUpdatingOrder ? (
               <>
                 <span className="w-5 h-5 border-4 border-white/50 border-t-white rounded-full animate-spin"></span>
                 Syncing...
               </>
            ) : activeOrderId ? (
               <>Update & Make Payment <span className="text-2xl ml-1">🚀</span></>
            ) : (
               <>Secure Checkout <span className="text-xl ml-1">🔒</span></>
            )}
          </button>

          {/* Social Contact Section */}
          <div className="mt-8 pt-6 border-t border-rose-100/50">
            <p className="text-center text-rose-800/80 font-bold mb-4 text-sm uppercase tracking-widest">Need Help?</p>
            <div className="flex flex-col gap-3">
              <a 
                href="https://wa.me/923238750695" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl font-bold transition-all hover:shadow-sm group outline-none"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.513-18.396A11.838 11.838 0 0012.052.011C5.464.011.109 5.365.106 11.954c0 2.103.549 4.156 1.593 5.968L0 24l6.236-1.636a11.868 11.868 0 005.816 1.517h.005c6.587 0 11.942-5.354 11.946-11.943a11.84 11.84 0 00-3.484-8.444z" />
                </svg>
                Contact Now
              </a>
              <a 
                href="https://www.instagram.com/elegent_sparkle_hub_?igsh=Y3Jud2poZ2c5bWow" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3.5 bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-pink-50 hover:from-indigo-100 hover:via-fuchsia-100 hover:to-pink-100 text-fuchsia-700 border border-fuchsia-200 rounded-xl font-bold transition-all hover:shadow-sm group outline-none"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.20 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                DM on Instagram
              </a>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal 
        isOpen={itemToRemove !== null}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => removeItem(itemToRemove?.id)}
        title="Remove Item?"
        message={`Are you sure you want to remove this masterpiece from your cart?`}
        confirmText="Remove Item"
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
        message="Are you sure you want to remove this attached picture from your order?"
        confirmText="Remove Picture"
        confirmColor="rose"
      />
    </div>
  );
}
