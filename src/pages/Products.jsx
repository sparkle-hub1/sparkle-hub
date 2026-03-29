import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function Products() {
  const { addItem } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestToast, setGuestToast] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      
      const snapshot = await getDocs(collection(db, 'products'));
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProducts(productsList);
      const cats = [...new Set(productsList.map(p => p.category).filter(Boolean))];
      setCategories(cats);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // ── Block guests from adding to cart ──
  const handleAddToCart = (product) => {
    if (!currentUser) {
      setGuestToast(true);
      setTimeout(() => {
        setGuestToast(false);
        navigate('/login');
      }, 1800);
      return;
    }
    addItem({ ...product, variation: product.variations?.[0] || 'Standard' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayedProducts = selectedCategory ? allProducts.filter(p => p.category === selectedCategory) : allProducts;

  return (
    <div className="w-full text-rose-950 relative">

      {/* Guest toast notification */}
      {guestToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl border bg-white border-rose-200 text-rose-700 animate-fade-in-up max-w-sm w-[90vw]">
          <span className="text-2xl">🔐</span>
          <p className="font-bold text-sm flex-1">Please login to add items to your cart.</p>
        </div>
      )}

      <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 text-center tracking-tight drop-shadow-sm">
        {selectedCategory ? `${selectedCategory} Collection` : 'All Collections'}
      </h2>

      {displayedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-rose-100">
            <span className="text-5xl">🌸</span>
          </div>
          <h3 className="text-2xl font-extrabold text-rose-900 mb-3">Collection Coming Soon</h3>
          <p className="text-rose-600/80 font-medium max-w-sm leading-relaxed">
            Our handcrafted resin pieces are being prepared. Check back soon for beautiful new arrivals!
          </p>
        </div>
      ) : (
      <div className="flex flex-col gap-16 px-2 sm:px-0">
        {(selectedCategory ? [selectedCategory] : categories).map(cat => {
          const catProducts = displayedProducts.filter(p => p.category === cat);
          if (catProducts.length === 0) return null;
          return (
            <div key={cat} className="flex flex-col w-full">
              <div className="flex justify-between items-end mb-6 px-2">
                <h3 className="text-3xl font-extrabold text-rose-950">{cat}</h3>
                {!selectedCategory && (
                  <Link to={`/products?category=${encodeURIComponent(cat)}`} className="text-sm font-bold text-pink-500 hover:text-pink-600 transition-colors uppercase tracking-widest hidden sm:block">View All</Link>
                )}
              </div>
              
              {/* Horizontal Scroll Container */}
              <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 pt-2 px-2 custom-scrollbar snap-x snap-mandatory">
                {catProducts.map(product => (
                  <div key={product.id} className="min-w-[260px] max-w-[280px] sm:min-w-[300px] sm:max-w-[320px] flex-shrink-0 snap-start bg-white/80 border border-white rounded-[1.2rem] sm:rounded-[2rem] p-3 sm:p-5 backdrop-blur-md hover:bg-white transition-all duration-500 hover:-translate-y-2 shadow-[0_10px_30px_rgba(255,228,230,0.5)] flex flex-col relative group">
                    
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-pink-100/50 rounded-full mix-blend-multiply filter blur-[30px] pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>
        
                    <Link to={`/product/${product.id}`} className="block aspect-square bg-rose-50 rounded-xl sm:rounded-2xl mb-4 overflow-hidden relative border border-rose-100 cursor-pointer z-10 w-full group/img">
                      {/* Discount Image Badge */}
                      {product.discount > 0 && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30">
                          <span className="bg-rose-500 text-white font-black px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs shadow-lg transform -rotate-12 inline-block">-{product.discount}%</span>
                        </div>
                      )}
                      
                      <img src={product.image} alt={product.name} className={`object-cover w-full h-full transition-transform duration-700 ease-out ${product.inStock !== false ? 'group-hover/img:scale-105' : 'grayscale-[50%] opacity-80'}`} />
                      {product.inStock === false && (
                        <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                          <span className="text-white font-black tracking-widest uppercase border-2 border-white/60 px-4 py-2 rounded-lg bg-rose-900/50 shadow-xl transform -rotate-12">Sold Out</span>
                        </div>
                      )}
                    </Link>
                    
                    <div className="flex-grow z-10">
                      <Link to={`/product/${product.id}`} className="hover:text-pink-500 transition-colors">
                        <h3 className="text-lg sm:text-2xl font-extrabold mb-1 sm:mb-2 text-rose-950 leading-tight line-clamp-1">{product.name}</h3>
                      </Link>
                      <p className="text-rose-800/70 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed font-medium hidden sm:block">{product.description}</p>
                    </div>
                    
                    <div className="mt-auto z-10 flex flex-col gap-4">
                      <div className="flex justify-between items-center bg-rose-50/50 p-2 sm:p-2.5 rounded-xl border border-rose-100/50 shadow-inner">
                        <div className="flex flex-col">
                          {product.discount > 0 && <span className="text-rose-400 font-bold line-through text-[10px] sm:text-xs leading-none">PKR {product.price}</span>}
                          <p className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 font-black text-xl sm:text-2xl leading-tight">
                            PKR {product.discount > 0 ? Math.floor(product.price * (1 - product.discount / 100)) : product.price}
                          </p>
                        </div>
                        {product.deliveryCharge > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] sm:text-[9px] text-rose-400 font-bold uppercase tracking-widest">Delivery</span>
                            <span className="text-xs sm:text-sm font-bold text-amber-600">+Rs. {product.deliveryCharge}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest py-1 px-2.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            Free Ship
                          </span>
                        )}
                      </div>
                      {product.inStock !== false ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product);
                            }}
                            className="flex-1 py-2.5 sm:py-3.5 bg-transparent hover:bg-rose-50 text-rose-600 border-2 border-rose-400 hover:border-pink-500 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 shadow-sm outline-none"
                          >
                            Choose options
                          </button>
                          <a
                            href={`https://wa.me/923238750695?text=Hi! I'm interested in: ${encodeURIComponent(product.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-2 border-emerald-300 hover:border-emerald-400 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm outline-none group"
                            title="Ask on WhatsApp"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.513-18.396A11.838 11.838 0 0012.052.011C5.464.011.109 5.365.106 11.954c0 2.103.549 4.156 1.593 5.968L0 24l6.236-1.636a11.868 11.868 0 005.816 1.517h.005c6.587 0 11.942-5.354 11.946-11.943a11.84 11.84 0 00-3.484-8.444z"/>
                            </svg>
                          </a>
                        </div>
                      ) : (
                        <button disabled className="w-full py-2.5 sm:py-3.5 bg-rose-50 text-rose-400 border-2 border-rose-200 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold cursor-not-allowed">
                          Out of Stock
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
