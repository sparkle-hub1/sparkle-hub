import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmLogoutModal from '../components/ConfirmLogoutModal';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutModalOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const NavItem = ({ to, icon, label }) => (
    <NavLink 
      to={to} 
      end={to === '/admin'}
      onClick={() => setIsSidebarOpen(false)}
      className={({ isActive }) => 
        `flex items-center gap-4 px-6 py-4 rounded-2xl mx-4 transition-all duration-300 font-bold ${
          isActive 
            ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-[0_10px_20px_rgba(244,114,182,0.3)] hover:shadow-[0_15px_30px_rgba(244,114,182,0.4)] hover:-translate-y-1' 
            : 'text-rose-600 hover:bg-rose-50 hover:text-pink-600'
        }`
      }
    >
      <span className="text-xl">{icon}</span>
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-rose-50 text-rose-950 font-sans overflow-hidden selection:bg-pink-400 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-white/40 backdrop-blur-md z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-rose-100 shadow-[20px_0_60px_rgba(255,228,230,0.5)] transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-24 flex items-center justify-center border-b border-rose-100">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-pink-500 tracking-tight drop-shadow-sm flex items-center gap-2">
            <span className="text-2xl">💍</span> Workspace
          </h1>
        </div>

        <nav className="flex-1 py-8 space-y-3 overflow-y-auto custom-scrollbar">
          <NavItem to="/admin" icon="📊" label="Dashboard" />
          <NavItem to="/admin/users" icon="👥" label="Registered Users" />
          <NavItem to="/admin/orders" icon="📦" label="Manage Orders" />
          <NavItem to="/admin/products" icon="💎" label="Masterpieces" />
          <NavItem to="/admin/advertisements" icon="📢" label="Advertisements" />
        </nav>

        <div className="p-6 border-t border-rose-100 bg-rose-50/50 mt-auto">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-rose-200 hover:bg-red-50 hover:border-red-200 rounded-2xl font-bold text-rose-600 hover:text-red-500 transition-all shadow-sm"
          >
            <span className="text-lg">🚪</span> Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Mobile Header */}
        <header className="md:hidden h-20 bg-white/70 backdrop-blur-2xl border-b border-rose-100 flex items-center justify-between px-5 sm:px-8 shadow-[0_1px_10px_rgba(255,228,230,0.4)] z-30">
          <h1 className="text-xl font-black text-rose-950 tracking-tight">Admin Console</h1>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 text-rose-600 hover:text-pink-500 focus:outline-none bg-rose-50 rounded-2xl active:scale-95 transition-all"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 sm:p-6 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmLogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogout} 
      />
    </div>
  );
}
