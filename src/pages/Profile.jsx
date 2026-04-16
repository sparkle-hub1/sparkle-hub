import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ReviewModal from '../components/ReviewModal';

export default function Profile() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { addItem, cart, setActiveOrderId } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, product: null });
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  const handleOrderAgain = (order) => {
    if (!order.items || order.items.length === 0) return;
    
    // Add all items from past order to the cart
    order.items.forEach(item => {
       addItem({ ...item }); 
    });
    // Redirect to cart
    navigate('/cart');
  };

  const handleMakePayment = async (order) => {
    setIsSyncingPayment(true);
    try {
      let mergedItems = [...order.items];
      
      // If the user has an active cart right now, mathematically merge it with this old draft to fulfill the pipeline rule
      cart.forEach(cartItem => {
         const existing = mergedItems.find(i => i.id === cartItem.id && i.variation === cartItem.variation);
         if (existing) {
            existing.quantity += cartItem.quantity;
         } else {
            mergedItems.push({...cartItem});
         }
      });

      // Recalculate Grand Totals precisely based on the merged array
      // Delivery charged ONCE per unique product (not multiplied by quantity)
      const newCartTotal = mergedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const newDeliveryTotal = mergedItems.reduce((sum, item) => sum + (item.deliveryCharge || 0), 0);
      const newGrandTotal = newCartTotal + newDeliveryTotal;
      
      // Cement this draft document as globally active
      setActiveOrderId(order.id);

      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
         items: mergedItems,
         totalAmount: newGrandTotal,
         deliveryCharges: newDeliveryTotal
      });

      navigate('/payment', { state: { orderId: order.id, grandTotal: newGrandTotal } });
    } catch (error) {
      console.error("Error merging and opening cart:", error);
      alert("Failed to securely open payment gateway. Try again.");
    } finally {
      setIsSyncingPayment(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
    window.location.href = '/';
  };

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        
        const ordersList = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            dateObj: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(0),
            date: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            }) : 'Unknown Date'
          };
        });
        
        ordersList.sort((a, b) => b.dateObj - a.dateObj);
        setOrders(ordersList);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviewedProducts = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setReviewedProductIds(new Set(data.reviewedProducts || []));
        }
      } catch (err) {
        console.error("Error fetching reviewed products:", err);
      }
    };
    
    if (currentUser) {
      fetchMyOrders();
      fetchReviewedProducts();
    }
  }, [currentUser]);

  const handleReviewSuccess = (productId) => {
    setReviewedProductIds(prev => new Set([...prev, productId]));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Awaiting Payment': return 'bg-yellow-100/80 text-yellow-700 border-yellow-200 shadow-sm';
      case 'Pending': return 'bg-amber-100/80 text-amber-700 border-amber-200 shadow-sm';
      case 'Confirmed': return 'bg-sky-100/80 text-sky-700 border-sky-200 shadow-sm';
      case 'Packed': return 'bg-violet-100/80 text-violet-700 border-violet-200 shadow-sm';
      case 'Dispatched': return 'bg-teal-100/80 text-teal-700 border-teal-200 shadow-sm';
      case 'Delivered': return 'bg-emerald-100/80 text-emerald-700 border-emerald-200 shadow-sm';
      case 'Rejected': return 'bg-red-100/80 text-red-700 border-red-200 shadow-sm';
      default: return 'bg-gray-100/80 text-gray-700 border-gray-200 shadow-sm';
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full pt-4 sm:pt-10 px-4 text-rose-950 animate-fade-in-up">
      
      {/* Profile Header */}
      <div className="bg-white/95 border border-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-12 mb-10 backdrop-blur-xl shadow-[0_20px_50px_rgba(255,228,230,0.7)] flex flex-col items-center md:flex-row md:justify-between gap-6 relative overflow-hidden group">
         <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-100/60 rounded-full filter blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>
         
         <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 sm:gap-6 z-10 w-full md:w-auto">
           <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center text-3xl sm:text-5xl font-black text-white shadow-xl border-4 border-white shrink-0 transform hover:rotate-6 transition-transform">
             {currentUser?.email?.charAt(0).toUpperCase()}
           </div>
           <div className="max-w-full overflow-hidden">
             <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-rose-950 mb-1 leading-tight tracking-tight">Personal Collection</h1>
             <p className="text-rose-600 font-bold text-sm sm:text-base truncate px-2 md:px-0" title={currentUser?.email}>{currentUser?.email}</p>
             {isAdmin && <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200">System Admin</span>}
           </div>
         </div>
         
         <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 sm:gap-4 z-10">
           {isAdmin && (
             <Link to="/admin" className="flex-1 sm:flex-none justify-center px-6 py-3.5 bg-white border border-rose-100 hover:bg-rose-50 hover:border-pink-300 rounded-xl sm:rounded-2xl font-bold text-rose-700 shadow-sm transition-all text-sm outline-none active:scale-95 text-center">Dashboard</Link>
           )}
           <button onClick={() => setIsChangingPassword(true)} className="flex-1 sm:flex-none justify-center px-6 py-3.5 bg-white border border-rose-100 hover:bg-rose-50 hover:border-pink-300 rounded-xl sm:rounded-2xl font-bold text-rose-700 shadow-sm transition-all text-sm outline-none active:scale-95">🔐 Password</button>
           <button onClick={() => setIsLogoutModalOpen(true)} className="flex-1 sm:flex-none justify-center px-6 py-3.5 bg-rose-50/50 hover:bg-red-50 hover:text-red-600 border border-rose-100 hover:border-red-200 rounded-xl sm:rounded-2xl font-bold text-rose-500 shadow-sm transition-all text-sm outline-none active:scale-95">Sign Out</button>
         </div>
      </div>

      {/* Order History */}
      <div className="mb-20">
        <h2 className="text-2xl font-black mb-8 text-rose-950 flex items-center gap-4">
          Order Archives
          <div className="h-px flex-1 bg-gradient-to-r from-rose-200 to-transparent"></div>
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-rose-400 text-sm animate-pulse">Retrieving Archives...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 border border-white rounded-[2rem] sm:rounded-[3rem] p-10 sm:p-20 text-center backdrop-blur-xl shadow-[0_15px_40px_rgba(255,228,230,0.5)]">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
               <span className="text-4xl animate-bounce">🎨</span>
            </div>
            <h3 className="text-rose-950 font-black text-xl sm:text-2xl mb-3 leading-tight tracking-tight">No Commissioned Pieces Yet</h3>
            <p className="text-rose-800/80 text-sm sm:text-lg mb-8 font-medium">Your personal gallery is empty. Let's start with something beautiful.</p>
            <Link to="/products" className="inline-block px-10 py-5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl font-black text-base sm:text-lg text-white shadow-[0_10px_20px_rgba(244,114,182,0.3)] hover:shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 outline-none">Explore Storefront</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map(order => (
              <div key={order.id} className="bg-white/90 border border-white rounded-[2.5rem] p-6 lg:p-8 backdrop-blur-xl flex flex-col lg:flex-row gap-8 relative overflow-hidden group shadow-[0_10px_30px_rgba(255,228,230,0.6)] hover:shadow-[0_15px_40px_rgba(255,228,230,0.8)] transition-all">
                
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${
                  order.orderStatus === 'Awaiting Payment' ? 'bg-yellow-400' :
                  order.orderStatus === 'Pending' ? 'bg-amber-400' :
                  order.orderStatus === 'Packed' ? 'bg-violet-400' :
                  order.orderStatus === 'Dispatched' ? 'bg-teal-400' :
                  order.orderStatus === 'Delivered' ? 'bg-emerald-400' :
                  order.orderStatus === 'Rejected' ? 'bg-red-400' : 'bg-sky-400'
                }`}></div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-2 md:p-0">
                  <div className="order-1 md:order-none">
                    <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">Order ID</p>
                    <p className="font-mono text-rose-900 bg-rose-50/80 font-bold text-[10px] sm:text-xs px-3 py-1.5 rounded-lg border border-rose-100 inline-block truncate max-w-full">REF {order.id.slice(0, 12)}...</p>
                  </div>
                  <div className="order-2 md:order-none">
                    <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1.5">Date Authenticated</p>
                    <p className="text-rose-950 font-black text-sm sm:text-base">{order.date}</p>
                  </div>
                  <div className="order-4 md:order-none">
                    <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1.5">Total Valuation</p>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 font-black text-xl sm:text-2xl">PKR {order.totalAmount?.toFixed(0)}</p>
                  </div>
                  <div className="order-3 md:order-none">
                    <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-2">Current Pipeline</p>
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-sm border ${getStatusColor(order.orderStatus)}`}>
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                      {order.orderStatus || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-rose-100 pt-6 lg:pt-0 lg:pl-8">
                   <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-4">Commissioned Details</p>
                   <div className="space-y-4">
                     {order.items?.slice(0, 3).map((item, idx) => (
                       <div key={idx} className="flex items-center gap-3 bg-rose-50/50 p-2 rounded-xl border border-rose-50">
                         <img src={item.image} alt={item.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-sm border border-white shrink-0" />
                         <div className="flex-1 min-w-0">
                           <p className="text-xs font-black text-rose-950 truncate">{item.name}</p>
                           <p className="text-[10px] text-rose-500 font-bold">Qty {item.quantity} {item.variation && <span className="font-black text-pink-600 ml-1"># {item.variation}</span>}</p>
                         </div>
                         {order.orderStatus === 'Delivered' && (
                           <div className="shrink-0">
                             {reviewedProductIds.has(item.id) ? (
                               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1">
                                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                 Reviewed
                               </span>
                             ) : (
                               <button
                                 onClick={() => setReviewModal({ open: true, product: item })}
                                 className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
                               >
                                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                 Rate
                               </button>
                             )}
                           </div>
                         )}
                       </div>
                     ))}
                     {order.items?.length > 3 && (
                       <p className="text-[10px] text-rose-400 font-black text-center bg-rose-50 py-2 rounded-xl border border-rose-100 border-dashed">+{order.items.length - 3} more masterpieces</p>
                     )}
                   </div>
                   
                   {order.customPictures && order.customPictures.length > 0 && (
                     <div className="mt-6 border-t border-rose-50 pt-4">
                       <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-3">Custom Media</p>
                       <div className="flex flex-wrap gap-2">
                         {order.customPictures.map((pic, idx) => (
                           <a key={idx} href={pic} target="_blank" rel="noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-rose-100 shadow-sm hover:scale-110 transition-transform block shrink-0 active:scale-90">
                             <img src={pic} alt="Ref" className="w-full h-full object-cover" />
                           </a>
                         ))}
                       </div>
                     </div>
                   )}
                   
                   {order.orderStatus === 'Awaiting Payment' ? (
                     <button 
                       onClick={() => handleMakePayment(order)}
                       disabled={isSyncingPayment}
                       className="mt-6 w-full py-4 bg-rose-950 hover:bg-black text-white rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-3 outline-none disabled:opacity-50 active:scale-95 text-xs sm:text-sm uppercase tracking-widest"
                     >
                       {isSyncingPayment ? (
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         <><span>💳</span> Complete Payment</>
                       )}
                     </button>
                   ) : (
                     <button 
                       onClick={() => handleOrderAgain(order)}
                       className="mt-6 w-full py-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 hover:border-pink-300 rounded-xl font-black shadow-sm transition-all flex items-center justify-center gap-2 group outline-none active:scale-95 text-[10px] uppercase tracking-widest"
                     >
                       <span className="text-lg group-hover:rotate-12 transition-transform duration-300">🔁</span> Repurchase Piece
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmLogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogout} 
      />

      {isChangingPassword && (
        <ChangePasswordModal onClose={() => setIsChangingPassword(false)} />
      )}

      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, product: null })}
        productData={reviewModal.product}
        currentUser={currentUser}
        onReviewSuccess={handleReviewSuccess}
      />
    </div>
  );
}
