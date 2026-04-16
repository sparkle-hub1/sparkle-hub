import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import sparkleLogo from '../assets/sparkle.jpg';
import ConfirmLogoutModal from './ConfirmLogoutModal';

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileAccordionOpen, setIsMobileAccordionOpen] = useState(false);
  // This ref is ONLY attached to the desktop dropdown wrapper — no duplication
  const desktopCollectionsRef = useRef(null);
  const location = useLocation();

  // Close DESKTOP dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (desktopCollectionsRef.current && !desktopCollectionsRef.current.contains(e.target)) {
        setIsDesktopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const cats = [...new Set(snapshot.docs.map(doc => doc.data().category).filter(Boolean))];
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
    setIsDesktopDropdownOpen(false);
    setIsMobileAccordionOpen(false);
  };

  const isCollectionsActive = location.pathname === '/products' && location.search.includes('category');

  // ── Shared simple nav links (Home, Shop, Track, Cart, Admin, Profile) ──
  const CommonLinks = ({ mobile }) => (
    <>
      <Link
        to="/"
        onClick={handleLinkClick}
        className={`hover:text-pink-600 transition-colors font-semibold ${mobile ? 'px-4 py-2' : ''} ${location.pathname === '/' ? 'text-pink-600' : 'text-rose-800'}`}
      >
        Home
      </Link>

      <Link
        to="/products"
        onClick={handleLinkClick}
        className={`hover:text-pink-600 transition-colors font-semibold ${mobile ? 'px-4 py-2' : ''} ${(location.pathname === '/products' && !location.search.includes('category')) ? 'text-pink-600' : 'text-rose-800'}`}
      >
        Shop
      </Link>

      <Link
        to="/track-order"
        onClick={handleLinkClick}
        className={`hover:text-pink-600 transition-colors font-semibold ${mobile ? 'px-4 py-2' : ''} ${location.pathname === '/track-order' ? 'text-pink-600' : 'text-rose-800'}`}
      >
        Track Order
      </Link>

      {currentUser && (
        <Link
          to="/cart"
          onClick={handleLinkClick}
          className={`hover:text-pink-600 transition-colors relative flex items-center font-semibold ${mobile ? 'px-4 py-2' : ''} ${location.pathname === '/cart' ? 'text-pink-600' : 'text-rose-800'}`}
        >
          Cart
          {cartCount > 0 && (
            <span className="ml-1 bg-gradient-to-r from-pink-400 to-rose-400 text-[10px] font-bold text-white rounded-full px-2 py-0.5 shadow-md animate-pulse">
              {cartCount}
            </span>
          )}
        </Link>
      )}

      {isAdmin && (
        <Link
          to="/admin"
          onClick={handleLinkClick}
          className={`text-cyan-700 hover:text-cyan-900 font-bold border border-cyan-400/50 hover:bg-cyan-50 rounded-full transition-all text-center ${mobile ? 'px-4 py-2 mx-4' : 'px-4 py-1.5'}`}
        >
          Admin Dashboard
        </Link>
      )}

      {currentUser ? (
        <div className={`flex items-center gap-2 ${mobile ? 'flex-col items-stretch mt-4 px-4 pt-4 border-t border-rose-100 gap-0' : 'flex-row md:ml-4 gap-6'}`}>
          <Link
            to="/profile"
            onClick={handleLinkClick}
            className={`hover:text-pink-600 text-rose-800 transition-colors font-bold ${mobile ? 'py-2' : ''}`}
          >
            Profile
          </Link>
          <button
            onClick={() => { setIsLogoutModalOpen(true); handleLinkClick(); }}
            className={`text-red-500 hover:text-red-700 transition-colors font-bold text-left ${mobile ? 'py-2' : ''}`}
          >
            Logout
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          onClick={handleLinkClick}
          className={`bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 font-bold transition-all shadow-md hover:shadow-pink-300 text-center text-white ${mobile ? 'px-6 py-3 rounded-full mt-4 mx-4' : 'md:ml-4 px-6 py-2.5 rounded-full'}`}
        >
          Login
        </Link>
      )}
    </>
  );

  // Category list items (shared content, different wrappers)
  const CategoryItems = ({ onNavigate }) =>
    categories.length > 0 ? categories.map((cat, idx) => (
      <Link
        key={idx}
        to={`/products?category=${encodeURIComponent(cat)}`}
        onClick={onNavigate}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-800 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:text-pink-600 transition-all group"
      >
        <span className="w-7 h-7 rounded-xl bg-rose-50 group-hover:bg-white flex items-center justify-center text-sm shadow-sm border border-rose-100 shrink-0">💎</span>
        {cat}
        <svg className="w-3.5 h-3.5 ml-auto text-rose-300 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    )) : (
      <p className="text-sm text-rose-400 text-center py-4 font-medium">No collections found</p>
    );

  return (
    <nav className="w-full z-50 bg-white/80 md:bg-white/70 backdrop-blur-xl border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border-2 border-rose-200 shadow-md bg-rose-50">
              <img src={sparkleLogo} alt="Sparkle Hub Logo" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
            <span className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 tracking-tight">
              Sparkle Hub
            </span>
          </Link>

          {/* Mobile: cart badge + hamburger */}
          <div className="flex md:hidden items-center">
            {currentUser && cartCount > 0 && !isOpen && (
              <Link to="/cart" className="mr-6 relative">
                <span className="text-xl">🛒</span>
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-400 to-rose-400 text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-md ring-2 ring-white">
                  {cartCount}
                </span>
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-rose-800 hover:text-pink-600 focus:outline-none p-2"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>

          {/* ── DESKTOP MENU ── */}
          <div className="hidden md:flex items-center gap-6 text-rose-900">

            <Link to="/" onClick={handleLinkClick} className={`hover:text-pink-600 transition-colors font-semibold ${location.pathname === '/' ? 'text-pink-600' : 'text-rose-800'}`}>Home</Link>

            {/* Desktop Collections dropdown — ref lives here ONLY */}
            <div className="relative" ref={desktopCollectionsRef}>
              <button
                onClick={() => setIsDesktopDropdownOpen(prev => !prev)}
                className={`flex items-center gap-1.5 hover:text-pink-600 transition-colors font-semibold outline-none select-none ${isCollectionsActive ? 'text-pink-600' : 'text-rose-800'}`}
              >
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Collections
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isDesktopDropdownOpen ? 'rotate-180 text-pink-500' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Floating card panel */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 w-72 z-[999] pt-4 transition-all duration-300 ease-out origin-top ${
                isDesktopDropdownOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
                <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(244,114,182,0.25)] border border-rose-100/80 overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-[3px] mb-0.5">Browse By</p>
                    <p className="text-base font-black text-white">Collections</p>
                  </div>
                  <div className="p-3 max-h-64 overflow-y-auto">
                    <CategoryItems onNavigate={handleLinkClick} />
                  </div>
                </div>
              </div>
            </div>

            <Link to="/products" onClick={handleLinkClick} className={`hover:text-pink-600 transition-colors font-semibold ${(location.pathname === '/products' && !location.search.includes('category')) ? 'text-pink-600' : 'text-rose-800'}`}>Shop</Link>
            <Link to="/track-order" onClick={handleLinkClick} className={`hover:text-pink-600 transition-colors font-semibold ${location.pathname === '/track-order' ? 'text-pink-600' : 'text-rose-800'}`}>Track Order</Link>

            {currentUser && (
              <Link to="/cart" onClick={handleLinkClick} className={`hover:text-pink-600 transition-colors relative flex items-center font-semibold ${location.pathname === '/cart' ? 'text-pink-600' : 'text-rose-800'}`}>
                Cart
                {cartCount > 0 && (
                  <span className="ml-1 bg-gradient-to-r from-pink-400 to-rose-400 text-[10px] font-bold text-white rounded-full px-2 py-0.5 shadow-md animate-pulse">{cartCount}</span>
                )}
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" onClick={handleLinkClick} className="text-cyan-700 hover:text-cyan-900 font-bold border border-cyan-400/50 hover:bg-cyan-50 px-4 py-1.5 rounded-full transition-all">
                Admin Dashboard
              </Link>
            )}

            {currentUser ? (
              <div className="flex items-center gap-6 ml-4">
                <Link to="/profile" onClick={handleLinkClick} className="hover:text-pink-600 text-rose-800 transition-colors font-bold">Profile</Link>
                <button onClick={() => { setIsLogoutModalOpen(true); handleLinkClick(); }} className="text-red-500 hover:text-red-700 transition-colors font-bold">Logout</button>
              </div>
            ) : (
              <Link to="/login" onClick={handleLinkClick} className="ml-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 px-6 py-2.5 rounded-full font-bold transition-all shadow-md hover:shadow-pink-300 text-white">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <div className={`md:hidden absolute w-full left-0 right-0 bg-white/98 backdrop-blur-2xl border-b border-rose-200 shadow-[0_30px_60px_rgba(255,228,230,0.4)] transition-all duration-[400ms] ease-out overflow-hidden ${isOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col pt-2 pb-6 px-4">
          <Link to="/" onClick={handleLinkClick} className={`px-4 py-3.5 text-[15px] font-black tracking-wide border-b border-rose-50 transition-all rounded-xl ${location.pathname === '/' ? 'text-pink-600 bg-rose-50/50' : 'text-rose-900 hover:bg-rose-50/30'}`}>Home</Link>

          {/* Mobile Collections accordion */}
          <div className="border-b border-rose-50">
            <button
              onClick={() => setIsMobileAccordionOpen(prev => !prev)}
              className={`flex items-center justify-between w-full px-4 py-3.5 text-[15px] font-black tracking-wide transition-all rounded-xl outline-none select-none ${isCollectionsActive ? 'text-pink-600 bg-rose-50/50' : 'text-rose-900 hover:bg-rose-50/30'}`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Collections
              </div>
              <svg className={`w-4 h-4 transition-transform duration-300 ${isMobileAccordionOpen ? 'rotate-180 text-pink-500' : 'text-rose-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileAccordionOpen ? 'max-h-[400px] opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-col pl-4 space-y-1">
                {categories.length > 0 ? categories.map((cat, idx) => (
                  <Link
                    key={idx}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 py-3 px-4 text-sm font-bold text-rose-700 hover:text-pink-600 transition-colors bg-rose-50/30 rounded-xl"
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm border border-rose-100 text-xs">💎</span>
                    {cat}
                  </Link>
                )) : (
                  <p className="text-sm text-rose-400 py-3 px-4 font-medium italic">No collections found</p>
                )}
              </div>
            </div>
          </div>

          <Link to="/products" onClick={handleLinkClick} className={`px-4 py-3.5 text-[15px] font-black tracking-wide border-b border-rose-50 transition-all rounded-xl ${(location.pathname === '/products' && !location.search.includes('category')) ? 'text-pink-600 bg-rose-50/50' : 'text-rose-900 hover:bg-rose-50/30'}`}>Shop All</Link>
          <Link to="/track-order" onClick={handleLinkClick} className={`px-4 py-3.5 text-[15px] font-black tracking-wide border-b border-rose-50 transition-all rounded-xl ${location.pathname === '/track-order' ? 'text-pink-600 bg-rose-50/50' : 'text-rose-900 hover:bg-rose-50/30'}`}>Track Order</Link>

          {currentUser && (
            <Link to="/cart" onClick={handleLinkClick} className={`px-4 py-3.5 text-[15px] font-black tracking-wide border-b border-rose-50 transition-all rounded-xl flex justify-between items-center ${location.pathname === '/cart' ? 'text-pink-600 bg-rose-50/50' : 'text-rose-900 hover:bg-rose-50/30'}`}>
              My Cart
              {cartCount > 0 && <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-xs font-black text-white rounded-full px-2.5 py-1 shadow-md animate-bounce">{cartCount} items</span>}
            </Link>
          )}

          {isAdmin && (
            <div className="pt-4 pb-2">
              <Link to="/admin" onClick={handleLinkClick} className="block w-full text-cyan-800 bg-cyan-50 font-black border-2 border-cyan-200 py-3 rounded-2xl transition-all text-center">
                Admin Dashboard
              </Link>
            </div>
          )}

          {currentUser ? (
            <div className="flex space-x-3 mt-4">
              <Link to="/profile" onClick={handleLinkClick} className="flex-1 py-3 text-center bg-rose-50 font-black text-rose-900 border border-rose-100 rounded-2xl transition-colors">Profile</Link>
              <button onClick={() => { setIsLogoutModalOpen(true); handleLinkClick(); }} className="flex-1 py-3 text-center bg-red-50 font-black text-red-600 border border-red-100 rounded-2xl transition-colors">Logout</button>
            </div>
          ) : (
            <div className="mt-6 mb-2">
              <Link to="/login" onClick={handleLinkClick} className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 py-3.5 rounded-2xl font-black text-[15px] transition-all shadow-[0_8px_20px_rgba(244,114,182,0.3)] text-center text-white active:scale-95">
                Login / Register
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          setIsLogoutModalOpen(false);
          await logout();
          window.location.href = '/';
        }}
      />
    </nav>
  );
}
