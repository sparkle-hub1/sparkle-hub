import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Fetch Orders
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const ordersData = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setUsers(usersData);
      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate ? timestamp.toDate().toLocaleDateString() : new Date(timestamp).toLocaleDateString();
  };

  // Compute enriched users with their attached orders
  const enrichedUsers = users.map(user => {
    const userOrders = orders.filter(o => o.userId === user.id || o.userEmail === user.email);
    const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    return {
      ...user,
      orders: userOrders,
      totalSpent
    };
  });

  return (
    <div className="max-w-7xl mx-auto w-full pt-4 sm:pt-8 animate-fade-in-up">
      <div className="mb-10 text-center sm:text-left text-rose-950 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">Registered Users</h1>
          <p className="text-rose-800/80 font-medium">View your entire customer base and track their complete order history.</p>
        </div>
        <div className="bg-white/80 border border-white px-6 py-4 rounded-2xl shadow-sm flex items-center gap-4">
           <div className="text-center">
             <span className="block text-2xl font-black text-rose-600">{users.length}</span>
             <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Total Users</span>
           </div>
           <div className="w-px h-10 bg-rose-200"></div>
           <div className="text-center">
             <span className="block text-2xl font-black text-pink-500">{orders.length}</span>
             <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Total Orders</span>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-rose-800 font-bold animate-pulse">Loading customer profiles...</p>
        </div>
      ) : enrichedUsers.length === 0 ? (
        <div className="text-center py-16 bg-white/80 border border-white rounded-[2rem] shadow-sm backdrop-blur-md">
          <span className="text-6xl block mb-4">👥</span>
          <h3 className="text-rose-950 font-black text-2xl mb-2">No users registered yet</h3>
          <p className="text-rose-800/70 font-medium">Once a customer signs up, their profile and history will appear here.</p>
        </div>
      ) : (
        <div className="bg-white/80 border border-white rounded-[2rem] shadow-[0_20px_50px_rgba(255,228,230,0.5)] backdrop-blur-md overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-rose-50/50 border-b border-rose-100 text-xs font-black text-rose-500 uppercase tracking-widest items-center">
            <div className="col-span-5">Customer Account</div>
            <div className="col-span-2 text-center">Join Date</div>
            <div className="col-span-2 text-center">Total Lifetime Value</div>
            <div className="col-span-2 text-center">Orders Placed</div>
            <div className="col-span-1 text-right">History</div>
          </div>

          {/* User List Accordion */}
          <div className="divide-y divide-rose-100 flex-1 overflow-y-auto">
            {enrichedUsers.map((user) => {
               const isExpanded = expandedUserId === user.id;

               return (
                  <div key={user.id} className="transition-all duration-300 hover:bg-rose-50/30">
                     {/* User Row */}
                     <div 
                       onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                       className="cursor-pointer px-4 sm:px-8 py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group"
                     >
                        <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center text-rose-700 font-black text-xl shadow-inner border border-rose-300">
                             {user.email.charAt(0).toUpperCase()}
                           </div>
                           <div className="overflow-hidden">
                              <p className="font-bold text-rose-950 truncate" title={user.email}>{user.email}</p>
                              <p className="text-xs text-rose-500 font-medium translate-y-0.5">UID: <span className="font-mono text-[10px]">{user.id}</span></p>
                           </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 text-left md:text-center text-rose-800 font-medium text-sm">
                          {formatDate(user.createdAt)}
                        </div>
                        <div className="col-span-1 md:col-span-2 text-left md:text-center">
                           <span className="font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                             Rs. {user.totalSpent.toLocaleString()}
                           </span>
                        </div>
                        <div className="col-span-1 md:col-span-2 text-left md:text-center">
                           <span className="font-bold text-rose-800 text-sm">
                             {user.orders.length} Order{user.orders.length !== 1 ? 's' : ''}
                           </span>
                        </div>
                        <div className="col-span-1 text-right mt-2 md:mt-0">
                           <button className={`w-8 h-8 rounded-full flex justify-center items-center inline-flex bg-white border border-rose-200 text-rose-500 group-hover:bg-rose-50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                           </button>
                        </div>
                     </div>

                     {/* Order History Panel (Expanded) */}
                     {isExpanded && (
                       <div className="bg-rose-50/50 border-t border-rose-100 px-4 sm:px-8 py-6 shadow-inner animate-fade-in-up">
                          <h4 className="font-black text-rose-950 mb-4 flex items-center gap-2">
                             <span className="text-lg">🛍️</span> Order History Log
                          </h4>
                          
                          {user.orders.length === 0 ? (
                             <div className="text-center py-8 bg-white rounded-2xl border border-rose-100 border-dashed">
                               <p className="text-rose-800/70 font-medium text-sm">This customer hasn't placed any orders yet.</p>
                             </div>
                          ) : (
                             <div className="grid gap-3">
                                {user.orders.map(order => (
                                   <React.Fragment key={order.id}>
                                   <div className="bg-white border border-rose-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                                      <div className="flex flex-col gap-1">
                                         <div className="flex items-center gap-2">
                                           <span className="font-mono text-xs font-bold text-rose-400">#{order.id.slice(-6).toUpperCase()}</span>
                                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-widest ${getOrderStatusColor(order.orderStatus)}`}>
                                              {order.orderStatus}
                                           </span>
                                         </div>
                                         <span className="text-rose-950 font-bold">{formatDate(order.createdAt)}</span>
                                      </div>
                                      
                                      <div className="w-full sm:w-auto flex-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 mx-0 sm:mx-6">
                                         <div className="flex gap-2 w-max">
                                            {order.items?.map((item, idx) => (
                                               <div key={idx} className="flex items-center gap-2 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100" title={item.name}>
                                                  <div className="w-6 h-6 rounded-md overflow-hidden shrink-0">
                                                    <img src={item.image} alt="pic" className="w-full h-full object-cover" />
                                                  </div>
                                                  <span className="text-xs font-bold text-rose-900 max-w-[100px] truncate">{item.name}</span>
                                                  <span className="text-[10px] font-black text-pink-500 bg-white px-1.5 rounded">x{item.quantity}</span>
                                               </div>
                                            ))}
                                         </div>
                                      </div>

                                      <div className="flex flex-col items-end shrink-0 w-full sm:w-auto">
                                         <span className="text-xs text-rose-500 font-bold uppercase tracking-widest">Total</span>
                                         <span className="font-black text-rose-600 text-lg sm:text-xl">Rs. {order.totalAmount?.toLocaleString() || 0}</span>
                                      </div>
                                   </div>
                                   
                                   {order.customPictures && order.customPictures.length > 0 && (
                                     <div className="mt-3 pt-3 border-t border-rose-50 flex items-center gap-3 w-full">
                                       <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Custom Uploads:</span>
                                       <div className="flex flex-wrap gap-2">
                                         {order.customPictures.map((pic, idx) => (
                                           <a key={idx} href={pic} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-md overflow-hidden border border-rose-200 shadow-sm hover:scale-110 transition-transform block shrink-0" title="View Full Design">
                                             <img src={pic} alt="Ref" className="w-full h-full object-cover" />
                                           </a>
                                         ))}
                                       </div>
                                     </div>
                                   )}
                                   </React.Fragment>
                                ))}
                             </div>
                          )}
                       </div>
                     )}
                  </div>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
