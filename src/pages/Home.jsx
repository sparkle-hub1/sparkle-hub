import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import HeroSlider from '../components/HeroSlider';

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
    addItem({ ...product, variation: product.variations?.[0] || 'Standard' });
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-8 mt-4">
            {featured.map(product => (
              <div key={product.id} className="bg-white/90 border border-white rounded-[1.2rem] sm:rounded-[2.5rem] p-2 sm:p-7 backdrop-blur-md hover:bg-white transition-all duration-500 hover:-translate-y-2 group shadow-[0_10px_40px_rgba(255,228,230,0.4)] flex flex-col relative overflow-hidden">
                
                <Link to={`/product/${product.id}`} className="block aspect-square bg-rose-50/50 rounded-xl sm:rounded-[1.8rem] mb-2 sm:mb-6 overflow-hidden relative border border-rose-100/50 cursor-pointer z-10 w-full group/img">
                  {product.discount > 0 && (
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30">
                      <span className="bg-rose-500 text-white font-black px-2 sm:px-4 py-1 rounded-full text-[9px] sm:text-xs shadow-lg transform -rotate-12 inline-block">-{product.discount}%</span>
                    </div>
                  )}

                  <img src={product.image} alt={product.name} className={`object-cover w-full h-full transition-transform duration-1000 ease-out ${product.inStock !== false ? 'group-hover/img:scale-110' : 'grayscale-[50%] opacity-80'}`} />
                  
                  {product.inStock === false && (
                    <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[3px] flex items-center justify-center z-20">
                      <span className="text-white font-black tracking-widest uppercase border-2 border-white/60 px-3 sm:px-5 py-2 rounded-xl bg-rose-900/50 shadow-2xl transform -rotate-12 text-[10px] sm:text-lg">Sold Out</span>
                    </div>
                  )}
                </Link>
                
                <div className="flex-grow z-10 px-0.5 sm:px-1">
                  <div className="mb-1 sm:mb-3">
                    <span className="text-[7px] sm:text-[10px] font-black text-rose-400 uppercase tracking-[0.15em] bg-rose-50/80 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full">{product.category || 'Featured'}</span>
                  </div>
                  <Link to={`/product/${product.id}`} className="hover:text-pink-500 transition-colors">
                    <h3 className="text-sm sm:text-2xl font-black mb-1 sm:mb-2 text-rose-950 leading-tight line-clamp-1">{product.name}</h3>
                  </Link>
                  <p className="text-rose-800/60 text-[10px] sm:text-base mb-2 sm:mb-6 line-clamp-1 leading-relaxed font-medium hidden sm:block">{product.description}</p>
                </div>
                
                <div className="mt-auto flex flex-col z-10 pt-2 sm:pt-6 border-t border-rose-100/80 gap-2 sm:gap-6">
                  <div className="flex justify-between items-center bg-rose-50/30 p-1.5 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-100/30">
                    <div className="flex flex-col justify-center">
                      {product.discount > 0 && <span className="text-rose-400 font-bold line-through text-[7px] sm:text-xs leading-none mb-0.5 sm:mb-1">PKR {product.price}</span>}
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 font-black text-sm sm:text-2xl leading-none">
                        PKR {product.discount > 0 ? Math.floor(product.price * (1 - product.discount / 100)) : product.price}
                      </p>
                    </div>
                    {product.deliveryCharge > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[6px] sm:text-[10px] text-rose-300 font-bold uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Shipping</span>
                        <span className="text-[8px] sm:text-sm font-black text-amber-600 leading-none">Rs. {product.deliveryCharge}</span>
                      </div>
                    ) : (
                      <span className="text-[7px] sm:text-[11px] font-black text-emerald-500 uppercase tracking-widest py-1 px-2 sm:px-4 bg-emerald-50/50 rounded-full border border-emerald-100 shadow-sm">Free Delivery</span>
                    )}
                  </div>

                  {product.inStock !== false ? (
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="flex-1 py-1.5 sm:py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg sm:rounded-2xl text-[10px] sm:text-lg font-black transition-all shadow-md active:scale-95 uppercase tracking-tighter sm:tracking-normal"
                      >
                        Add Items
                      </button>
                      <a
                        href={`https://wa.me/923238750695?text=Hi! I'm interested in: ${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 w-8 h-8 sm:w-14 sm:h-14 flex items-center justify-center bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-emerald-200 hover:border-emerald-400 rounded-lg sm:rounded-2xl transition-all shadow-sm active:scale-95"
                      >
                        <svg className="w-4 h-4 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.513-18.396A11.838 11.838 0 0012.052.011C5.464.011.109 5.365.106 11.954c0 2.103.549 4.156 1.593 5.968L0 24l6.236-1.636a11.868 11.868 0 005.816 1.517h.005c6.587 0 11.942-5.354 11.946-11.943a11.84 11.84 0 00-3.484-8.444z"/>
                        </svg>
                      </a>
                    </div>
                  ) : (
                    <button disabled className="w-full py-2 sm:py-5 bg-rose-50 text-rose-400 border border-rose-200 rounded-lg sm:rounded-2xl text-[10px] sm:text-lg font-bold cursor-not-allowed uppercase tracking-widest">
                      UnAvailable
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
