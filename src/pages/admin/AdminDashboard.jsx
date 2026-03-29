import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordModal from '../../components/ChangePasswordModal';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        const productsCount = prodSnap.size;

        const orderSnap = await getDocs(collection(db, 'orders'));
        let rev = 0;
        let pending = 0;
        
        orderSnap.forEach(doc => {
          const data = doc.data();
          const validStatuses = ['Confirmed', 'Packed', 'Dispatched', 'Delivered'];
          if (validStatuses.includes(data.orderStatus)) {
            rev += (data.totalAmount || 0);
          }
          if (data.orderStatus === 'Pending') {
            pending++;
          }
        });

        setStats({
          totalProducts: productsCount,
          totalOrders: orderSnap.size,
          totalRevenue: rev,
          pendingOrders: pending
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, subtitle, icon, colorClassName, link }) => (
    <Link to={link || "#"} className={`bg-white/90 border border-rose-100 rounded-[2rem] p-8 shadow-sm hover:shadow-[0_15px_40px_rgba(255,228,230,0.8)] transition-all transform hover:-translate-y-2 relative overflow-hidden group ${link ? 'cursor-pointer' : 'cursor-default'}`}>
       <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full mix-blend-multiply opacity-20 filter blur-2xl transition-transform duration-500 group-hover:scale-150 ${colorClassName}`}></div>
       <div className="relative z-10 flex justify-between items-start">
         <div>
           <p className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-2">{title}</p>
           <h3 className="text-4xl lg:text-5xl font-black text-rose-950 mb-2 drop-shadow-sm">{loading ? '...' : value}</h3>
           <p className="text-xs font-bold text-rose-500 bg-rose-50 inline-block px-3 py-1 rounded-full">{subtitle}</p>
         </div>
         <div className={`text-5xl drop-shadow-sm opacity-80 transition-transform duration-300 group-hover:scale-110`}>{icon}</div>
       </div>
    </Link>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight mb-2">Control Center</h1>
          <p className="text-rose-800/70 font-medium text-lg">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsChangingPassword(true)}
            className="bg-white px-5 py-3 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-2 hover:bg-rose-50 hover:border-pink-200 transition-all font-bold text-rose-600 text-sm outline-none"
          >
            <span>🔐</span> Change Password
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        <StatCard 
          title="Total Revenue" 
          value={`PKR ${stats.totalRevenue.toFixed(0)}`} 
          subtitle="Net Lifetime Value" 
          icon="💰" 
          colorClassName="bg-emerald-400"
        />
        <StatCard 
          title="Attention Needed" 
          value={stats.pendingOrders} 
          subtitle="Pending Verifications" 
          icon="🔔" 
          colorClassName="bg-amber-400"
          link="/admin/orders"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          subtitle="Lifetime Processes" 
          icon="📦" 
          colorClassName="bg-sky-400"
          link="/admin/orders"
        />
        <StatCard 
          title="Masterpieces" 
          value={stats.totalProducts} 
          subtitle="Active Catalog Items" 
          icon="💎" 
          colorClassName="bg-violet-400"
          link="/admin/products"
        />
      </div>

      <div className="mt-12 bg-white/95 border border-rose-100 rounded-[3rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(255,228,230,0.6)] relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/50 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>
        <div className="w-24 h-24 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-200 relative z-10">
          <span className="text-4xl text-white">⚙️</span>
        </div>
        <h2 className="text-3xl font-black text-rose-950 mb-4 relative z-10 tracking-tight">System Integrity Check</h2>
        <p className="text-rose-800/80 max-w-2xl mx-auto font-medium mb-10 relative z-10 leading-relaxed">
          The database is connected and authenticating correctly. You can perfectly manage all resin masterpieces and order verifications directly from the sidebar. No anomalies detected.
        </p>
        <Link to="/products" className="inline-block px-10 py-5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-2xl font-black text-lg text-white shadow-[0_15px_30px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(244,114,182,0.4)] relative z-10 outline-none">
          View Live Storefront
        </Link>
      </div>

      {isChangingPassword && (
        <ChangePasswordModal onClose={() => setIsChangingPassword(false)} />
      )}
    </div>
  );
}
