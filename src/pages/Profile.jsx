import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { doc, updateDoc } from 'firebase/firestore';

export default function Profile() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { addItem, cart, setActiveOrderId } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
        
        const ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
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
    
    if (currentUser) {
      fetchMyOrders();
    }
  }, [currentUser]);

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
    <div className="max-w-6xl mx-auto w-full pt-10 px-4 text-rose-950">
      
      {/* Profile Header */}
      <div className="bg-white/95 border border-white rounded-[3rem] p-8 md:p-12 mb-10 backdrop-blur-xl shadow-[0_20px_50px_rgba(255,228,230,0.7)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
         <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-100/60 rounded-full filter blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>
         
         <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 z-10 w-full md:w-auto">
           <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center text-4xl sm:text-5xl font-black text-white shadow-[0_10px_20px_rgba(244,114,182,0.4)] border-4 border-white shrink-0">
             {currentUser?.email?.charAt(0).toUpperCase()}
           </div>
           <div>
             <h1 className="text-3xl sm:text-4xl font-black text-rose-950 mb-1 leading-tight tracking-tight">Your Collection</h1>
             <p className="text-rose-600 font-bold mb-3">{currentUser?.email}</p>
             {isAdmin && <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-200 shadow-sm">Administrator</span>}
           </div>
         </div>
         
         <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 z-10 mt-6 md:mt-0">
           {isAdmin && (
             <Link to="/admin" className="px-8 py-4 bg-white border border-rose-200 hover:bg-rose-50 hover:border-pink-300 rounded-2xl font-bold text-rose-700 shadow-sm transition-all text-center">Dashboard</Link>
           )}
           <button onClick={() => setIsChangingPassword(true)} className="px-8 py-4 bg-white border border-rose-200 hover:bg-rose-50 hover:border-pink-300 rounded-2xl font-bold text-rose-700 shadow-sm transition-all">🔐 Change Password</button>
           <button onClick={() => setIsLogoutModalOpen(true)} className="px-8 py-4 bg-rose-50 hover:bg-red-50 hover:text-red-600 border border-rose-100 hover:border-red-200 rounded-2xl font-bold text-rose-500 shadow-sm transition-all">Sign Out</button>
         </div>
      </div>

      {/* Order History */}
      <div className="mb-20">
        <h2 className="text-2xl font-black mb-8 text-rose-950 flex items-center gap-4">
          Order Archives
          <div className="h-px flex-1 bg-gradient-to-r from-rose-200 to-transparent"></div>
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 border border-white rounded-[3rem] p-16 text-center backdrop-blur-xl shadow-[0_15px_40px_rgba(255,228,230,0.5)]">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
               <span className="text-3xl">📭</span>
            </div>
            <p className="text-rose-800/80 text-lg mb-8 font-medium">You haven't commissioned any masterpieces yet.</p>
            <Link to="/products" className="inline-block px-10 py-5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full font-bold text-lg text-white shadow-[0_10px_20px_rgba(244,114,182,0.3)] hover:shadow-[0_15px_30px_rgba(244,114,182,0.4)] transition-all hover:-translate-y-1">Explore Resin Art</Link>
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

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pl-4">
                  <div>
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">Order ID</p>
                    <p className="font-mono text-rose-900 bg-rose-50 font-bold text-sm px-3 py-1.5 rounded-lg border border-rose-100 inline-block truncate max-w-full">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-1.5">Date Placed</p>
                    <p className="text-rose-950 font-bold">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-1.5">Total Amount</p>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 font-black text-2xl">PKR {order.totalAmount?.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Tracking Status</p>
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 ${getStatusColor(order.orderStatus)}`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      {order.orderStatus || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-rose-100 pt-6 lg:pt-0 lg:pl-8">
                   <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-4">Requisition Details</p>
                   <div className="space-y-4">
                     {order.items?.slice(0, 2).map((item, idx) => (
                       <div key={idx} className="flex items-center gap-4 bg-rose-50/50 p-2 rounded-xl border border-rose-50">
                         <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shadow-sm border border-white" />
                         <div className="flex-1">
                           <p className="text-sm font-bold text-rose-950 line-clamp-1">{item.name}</p>
                           <p className="text-xs text-rose-500 font-medium">Qty: {item.quantity} {item.variation && <span className="font-bold text-pink-600 ml-1">• {item.variation}</span>}</p>
                         </div>
                       </div>
                     ))}
                     {order.items?.length > 2 && (
                       <p className="text-xs text-rose-400 font-bold text-center bg-rose-50 py-2 rounded-xl border border-rose-100 border-dashed">+{order.items.length - 2} more item(s)</p>
                     )}
                   </div>
                   
                   {order.customPictures && order.customPictures.length > 0 && (
                     <div className="mt-6 border-t border-rose-100 pt-4">
                       <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-3">Your Reference Media</p>
                       <div className="flex flex-wrap gap-2">
                         {order.customPictures.map((pic, idx) => (
                           <a key={idx} href={pic} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg overflow-hidden border border-rose-100 shadow-sm hover:scale-110 transition-transform block shrink-0">
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
                       className="mt-6 w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl font-black shadow-[0_10px_20px_rgba(251,191,36,0.3)] hover:shadow-lg transition-all flex items-center justify-center gap-3 outline-none disabled:opacity-50 transform hover:-translate-y-1"
                     >
                       <span className="text-2xl drop-shadow-sm">💳</span> {isSyncingPayment ? 'Syncing...' : 'Make Payment to Proceed'}
                     </button>
                   ) : (
                     <button 
                       onClick={() => handleOrderAgain(order)}
                       className="mt-6 w-full py-3.5 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 hover:border-pink-400 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 group outline-none"
                     >
                       <span className="text-lg group-hover:scale-125 transition-transform duration-300">🛍️</span> Order Again
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
    </div>
  );
}
