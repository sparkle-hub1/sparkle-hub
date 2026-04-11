import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [guestToast, setGuestToast] = useState(false);
  const { addItem } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          if (data.variations && data.variations.length > 0) {
            setSelectedVariation(data.variations[0]);
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <h2 className="text-4xl font-extrabold text-rose-300 mb-6 tracking-widest drop-shadow-sm">PRODUCT NOT FOUND</h2>
        <Link to="/products" className="text-pink-500 font-bold hover:text-pink-600 text-lg border-b-2 border-pink-400/30 hover:border-pink-500 pb-1 transition-all">Return to Gallery</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!currentUser) {
      setGuestToast(true);
      setTimeout(() => {
        setGuestToast(false);
        navigate('/login');
      }, 1800);
      return;
    }
    const variationSuffix = selectedVariation ? `-${selectedVariation.toLowerCase().replace(/\s+/g, '-')}` : '';
    const cartItemId = `${product.id}${variationSuffix}`;
    addItem({ ...product, id: cartItemId, variation: selectedVariation });
  };

  return (
    <div className="max-w-6xl mx-auto w-full pt-4 md:pt-10 text-rose-950">
      <SEO 
        title={product.name}
        description={product.description}
        keywords={`resin ${product.name}, ${product.category}, customized resin art, buy ${product.name} pakistan`}
        image={product.image}
      />

      {/* Guest toast */}
      {guestToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl border bg-white border-rose-200 text-rose-700 animate-fade-in-up max-w-sm w-[90vw]">
          <span className="text-2xl">🔐</span>
          <p className="font-bold text-sm flex-1">Please login to add items to your cart.</p>
        </div>
      )}
      <Link to="/products" className="text-rose-600 hover:text-pink-500 mb-8 inline-flex items-center gap-2 transition-colors font-bold tracking-wide">
        <span className="text-xl leading-none">&larr;</span> Back to Collection
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 bg-white/90 border border-white rounded-[2rem] lg:rounded-[3rem] p-6 sm:p-10 lg:p-14 backdrop-blur-xl shadow-[0_20px_60px_rgba(255,228,230,0.8)] relative overflow-hidden">
        {/* Soft Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Image Display */}
        <div className="aspect-square bg-rose-50 rounded-[2rem] border border-rose-100 overflow-hidden shadow-inner relative group z-10">
          {/* Discount Image Badge */}
          {product.discount > 0 && (
            <div className="absolute top-4 right-4 z-30">
              <span className="bg-rose-500 text-white font-black px-4 py-2 rounded-full text-sm shadow-xl transform -rotate-12 inline-block">-{product.discount}% OFF</span>
            </div>
          )}
          <img src={product.image} alt={product.name} className={`object-cover w-full h-full transition-transform duration-700 ease-out ${product.inStock !== false ? 'group-hover:scale-105' : 'grayscale-[30%] opacity-90'}`} />
          {product.inStock === false && (
            <div className="absolute inset-0 bg-rose-950/20 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="text-white font-black tracking-widest lg:text-3xl lg:px-8 lg:py-4 uppercase border-4 border-white/60 px-6 py-3 rounded-2xl bg-rose-900/50 shadow-2xl transform -rotate-12">Sold Out</span>
            </div>
          )}
        </div>
        
        {/* Details Context */}
        <div className="flex flex-col justify-center z-10 pl-2">
          <div className="mb-6 flex items-center gap-4">
            <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-200 shadow-sm">
              {product.category || 'Resin Art'}
            </span>
            <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-200 shadow-sm">
              {product.category || 'Resin Art'}
            </span>
            {product.inStock !== false ? (
              <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                </span>
                In Stock
              </span>
            ) : (
              <span className="flex items-center gap-2 text-rose-500 font-bold text-sm tracking-widest uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
                </span>
                Sold Out
              </span>
            )}
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black mb-4 text-rose-950 leading-tight drop-shadow-sm">{product.name}</h1>
          
          {product.discount > 0 ? (
            <div className="flex items-end gap-4 mb-3">
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 drop-shadow-sm">PKR {Math.floor(product.price * (1 - product.discount / 100))}</p>
              <p className="text-2xl font-bold text-rose-300 line-through pb-1">PKR {product.price}</p>
              <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-sm font-black mb-1.5 border border-rose-100 shadow-sm inline-block">Save {product.discount}%</span>
            </div>
          ) : (
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-3 drop-shadow-sm">PKR {product.price}</p>
          )}
          
          {/* Live Delivery Charge Display */}
          <div className="flex items-center gap-3 mb-8">
            {(product.deliveryCharge === 0 || product.deliveryCharge === undefined) ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-sm font-bold shadow-sm">
                🎁 Free Delivery
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-bold shadow-sm">
                🚚 Delivery: PKR {product.deliveryCharge}
              </span>
            )}
          </div>
          
          <p className="text-lg text-rose-800/80 leading-relaxed mb-10 font-medium border-l-4 border-pink-300 pl-6 rounded-sm">
            {product.description}
          </p>
          
          {product.variations && product.variations.length > 0 && (
            <div className="mb-10 p-6 sm:p-8 bg-rose-50/50 border border-rose-100 rounded-[2rem] shadow-inner">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-5 flex items-center gap-3">
                Select Variation
                <div className="h-px flex-1 bg-gradient-to-r from-rose-200 to-transparent"></div>
              </h3>
              <div className="flex flex-wrap gap-4">
                {product.variations.map(variation => (
                  <button 
                    key={variation}
                    onClick={() => setSelectedVariation(variation)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all border ${
                      selectedVariation === variation 
                        ? 'bg-gradient-to-r from-pink-400 to-rose-400 border-transparent shadow-[0_10px_20px_rgba(244,114,182,0.4)] text-white scale-105' 
                        : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-pink-300 shadow-sm'
                    }`}
                  >
                    {variation}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {product.inStock !== false ? (
            <button 
              onClick={handleAddToCart}
              className="w-full py-5 lg:py-6 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-2xl font-black text-xl lg:text-2xl shadow-[0_15px_30px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(244,114,182,0.4)] flex items-center justify-center gap-3 text-white focus:outline-none"
            >
              Add to Cart
              <span className="text-2xl font-light">&rarr;</span>
            </button>
          ) : (
            <button 
              disabled
              className="w-full py-5 lg:py-6 bg-rose-100 text-rose-400 border-2 border-rose-200 rounded-2xl font-black text-xl lg:text-2xl flex items-center justify-center gap-3 cursor-not-allowed"
            >
              Out of Stock
              <span className="text-3xl font-light leading-none opacity-50">&times;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
