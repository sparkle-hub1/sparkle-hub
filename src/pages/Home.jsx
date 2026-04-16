import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import HeroSlider from '../components/HeroSlider';
import SEO from '../components/SEO';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [guestToast, setGuestToast] = useState(false);
  const { addItem } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (product) => {
    if (!currentUser) {
      setGuestToast(true);
      setTimeout(() => {
        setGuestToast(false);
        navigate('/login');
      }, 1800);
      return;
    }
    addItem({ ...product, productId: product.id, variation: product.variations?.[0] || 'Standard' });
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFeatured(productsList.slice(0, 3));

        const catMap = new Map();
        productsList.forEach(p => {
           if (p.category && !catMap.has(p.category)) {
              catMap.set(p.category, p.image);
           }
        });
        setCategories(Array.from(catMap.entries()).map(([name, image]) => ({ name, image })));

      } catch (err) {
        console.error(err);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-16 animate-fade-in-up w-full text-rose-950">
      <SEO 
        title="Home" 
        description="Shop the most exquisite handmade resin jewelry, personalized art, and customized gifts in Pakistan. Handcrafted with love at Sparkle Hub."
        keywords="resin jewelry, handmade art pakistan, epoxy gifts, customized accessories, sparkle hub home"
      />

      {/* Guest toast */}
      {guestToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl border bg-white border-rose-200 text-rose-700 animate-fade-in-up max-w-sm w-[90vw]">
          <span className="text-2xl">🔐</span>
          <p className="font-bold text-sm flex-1">Please login to add items to your cart.</p>
        </div>
      )}
      
      <HeroSlider />

      {/* Featured Collection Section */}
      {featured.length > 0 && (
        <div className="w-full max-w-7xl mx-auto pt-24 mt-4 border-t border-rose-200/50 text-left px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <h2 className="text-[2.2rem] sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight leading-none pb-2">Featured</h2>
            <Link to="/products" className="text-pink-500 font-black hover:text-pink-600 relative group pr-6 text-sm sm:text-lg tracking-widest uppercase">
              View All
              <span className="absolute right-0 group-hover:-right-2 transition-all">&rarr;</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8 mt-4">
            {featured.map(product => (
              <div key={product.id} className="bg-white rounded-2xl sm:rounded-[2.5rem] p-2 sm:p-5 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 shadow-[0_4px_25px_rgba(255,228,230,0.6)] flex flex-col group border border-rose-50 relative">
                
                <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] sm:aspect-square rounded-xl sm:rounded-[1.5rem] mb-3 overflow-hidden bg-rose-50/50">
                  {product.discount > 0 && (
                    <span className="absolute top-2 left-2 z-30 bg-rose-500 text-white text-[9px] sm:text-xs font-black px-2 py-0.5 rounded shadow-sm">-{product.discount}%</span>
                  )}
                  {/* Star Rating Badge on Image */}
                  {(product.averageRating > 0) ? (
                    <span className="absolute top-2 right-2 z-30 bg-white/95 backdrop-blur text-amber-500 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      {product.averageRating.toFixed(1)}
                    </span>
                  ) : null}
                  <img src={product.image} alt={product.name} className={`object-cover w-full h-full transition-transform duration-700 ease-out ${product.inStock !== false ? 'group-hover:scale-110' : 'grayscale-[50%] opacity-80'}`} />
                  
                  {product.inStock === false && (
                    <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                      <span className="text-white font-black tracking-widest uppercase border-2 border-white/60 px-3 sm:px-5 py-2 rounded-xl bg-rose-900/50 shadow-2xl transform -rotate-12 text-[10px] sm:text-lg">Sold Out</span>
                    </div>
                  )}

                  {product.inStock !== false && (
                    <a
                      href={`https://wa.me/923238750695?text=Hi! I'm interested in: ${encodeURIComponent(product.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-2 right-2 z-30 w-8 h-8 sm:w-12 sm:h-12 bg-white/95 backdrop-blur rounded-full flex items-center justify-center text-emerald-500 shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:scale-110 hover:text-emerald-600 transition-transform"
                    >
                      <svg className="w-4 h-4 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.513-18.396A11.838 11.838 0 0012.052.011C5.464.011.109 5.365.106 11.954c0 2.103.549 4.156 1.593 5.968L0 24l6.236-1.636a11.868 11.868 0 005.816 1.517h.005c6.587 0 11.942-5.354 11.946-11.943a11.84 11.84 0 00-3.484-8.444z"/>
                      </svg>
                    </a>
                  )}
                </Link>

                <div className="flex flex-col flex-grow px-1">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-rose-400 font-bold mb-1 leading-none">{product.category || 'Featured'}</span>
                  <Link to={`/product/${product.id}`} className="hover:text-pink-500 transition-colors">
                    <h3 className="text-sm sm:text-xl font-black text-rose-950 line-clamp-2 leading-[1.2] mb-1">{product.name}</h3>
                  </Link>
                  {product.orderCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-rose-500 mb-1">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/></svg>
                      {product.orderCount} ordered
                    </span>
                  )}
                  
                  <div className="mt-auto pt-1 flex flex-col gap-0.5 mb-1">
                    <div className="flex items-end gap-1.5 sm:gap-2">
                      <p className="text-[15px] sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 leading-none">
                        PKR {product.discount > 0 ? Math.floor(product.price * (1 - product.discount / 100)) : product.price}
                      </p>
                      {product.discount > 0 && <span className="text-[10px] sm:text-sm text-rose-300 line-through font-bold leading-none mb-[1px] sm:mb-[3px]">PKR {product.price}</span>}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${product.deliveryCharge === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {product.deliveryCharge === 0 ? '🎁 Free Delivery' : `🚚 +PKR ${product.deliveryCharge} delivery`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 w-full">
                  {product.inStock !== false ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      className="w-full py-2.5 sm:py-3.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-500 transition-all rounded-xl text-[11px] sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Add To Cart
                    </button>
                  ) : (
                    <button disabled className="w-full py-2.5 sm:py-3.5 bg-rose-50 text-rose-400 border border-rose-100 rounded-xl text-[11px] sm:text-sm font-bold cursor-not-allowed uppercase tracking-widest flex items-center justify-center">
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop by Category Section */}
      {categories.length > 0 && (
        <div className="w-full max-w-7xl mx-auto pt-20 mt-4 text-left px-4 sm:px-6 mb-20">
          <div className="mb-10">
            <h2 className="text-[2.2rem] sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight leading-none pb-2">Collections</h2>
            <p className="text-rose-800/50 font-medium mt-2 text-sm sm:text-lg">Find the perfect piece for your aesthetic</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8 mb-12">
            {categories.map((cat, idx) => (
              <Link key={idx} to={`/products?category=${encodeURIComponent(cat.name)}`} className="group relative block aspect-[4/5] sm:aspect-square rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-[0_15px_40px_rgba(255,228,230,0.5)]">
                <img src={cat.image} alt={cat.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-in-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/80 via-rose-900/40 to-transparent flex items-end p-4 sm:p-10">
                  <h3 className="text-lg sm:text-4xl font-black text-white drop-shadow-2xl group-hover:-translate-y-2 transition-transform duration-500">
                    {cat.name} <span className="hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity ml-2">&rarr;</span>
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex justify-center">
             <Link to="/products" className="px-10 sm:px-16 py-4 sm:py-5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-400 rounded-full font-black text-sm sm:text-xl transition-all shadow-sm active:scale-95">
               View All Collections
             </Link>
          </div>
        </div>
      )}

    </div>
  );
}
