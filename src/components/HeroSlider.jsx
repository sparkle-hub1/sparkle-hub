import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function HeroSlider() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'heroSlider'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().images) {
        setImages(docSnap.data().images);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching hero images:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    
    // Auto-advance every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (loading) {
     return <div className="h-[50vh] w-full flex items-center justify-center"><div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Fallback to original static hero if no images configured
  if (images.length === 0) {
    return (
      <div className="space-y-8 mt-10 md:mt-24 px-4 w-full max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-rose-500 via-pink-400 to-rose-300 mb-6 drop-shadow-sm leading-normal pb-2 sm:pb-4 text-center">
          Resin By Maryam
        </h1>
        <p className="text-xl md:text-2xl text-rose-800/80 font-medium leading-relaxed mx-auto max-w-2xl text-center">
          Handcrafted elegance. The ultimate hub designed with <span className="font-bold text-pink-500">premium pastel aesthetics</span> and <span className="font-bold text-rose-500">artistic detail</span>.
        </p>
        
        <div className="pt-10 flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link to="/products" className="px-10 py-5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full font-bold text-xl shadow-[0_10px_30px_rgba(244,114,182,0.3)] hover:shadow-[0_15px_40px_rgba(244,114,182,0.4)] hover:-translate-y-1 transition-all duration-300 outline-none flex items-center gap-3">
            Shop Collection <span className="text-2xl font-light">&rarr;</span>
          </Link>
          <Link to="/login" className="px-10 py-5 bg-white border border-rose-200 rounded-full font-bold text-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 shadow-sm transition-all duration-300 hover:-translate-y-1 outline-none">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[100vw] relative -mt-24 h-[65vh] sm:h-[80vh] md:h-[85vh] overflow-hidden z-0 flex-shrink-0 bg-transparent">
      
      {/* Background Images Layer */}
      {images.map((img, idx) => (
        <div 
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img 
            src={img.url} 
            alt="Showcase" 
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Persistent Gradient Overlay - Ensures text is always readable over ANY image */}
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-rose-950/40 via-rose-900/10 to-rose-50 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-rose-50 via-transparent to-transparent pointer-events-none"></div>

      {/* Hero Content Layer */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center pb-12 sm:pb-16">
        <h1 className="text-[2.6rem] sm:text-7xl md:text-[7rem] font-black tracking-tighter text-white mb-6 drop-shadow-[0_4px_12px_rgba(225,29,72,0.6)] leading-[1.1] sm:leading-none">
          Resin By Maryam
        </h1>
        <p className="text-sm sm:text-lg md:text-2xl text-rose-950 font-black leading-relaxed mx-auto max-w-[280px] sm:max-w-2xl drop-shadow-md bg-white/80 backdrop-blur-xl px-6 sm:px-10 py-3 sm:py-4 border border-white/60 shadow-[0_10px_30px_rgba(255,228,230,0.4)] rounded-full">
          Handcrafted elegance with <span className="text-pink-600 font-extrabold uppercase tracking-tight">premium aesthetics</span>
        </p>
        
        <div className="pt-10 sm:pt-16 flex justify-center items-center scale-90 sm:scale-100">
          <Link to="/products" className="px-10 sm:px-14 py-4 sm:py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-black text-lg sm:text-xl shadow-[0_15px_40px_rgba(244,114,182,0.4)] hover:shadow-[0_20px_50px_rgba(244,114,182,0.6)] hover:-translate-y-1 transition-all duration-300 outline-none flex items-center gap-3 sm:gap-4 border-2 border-white/20 whitespace-nowrap">
            Discover Masterpieces <span className="text-2xl sm:text-3xl leading-none drop-shadow-md pb-1">&rarr;</span>
          </Link>
        </div>

        {/* Custom Paging Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-6 sm:bottom-10 flex gap-4 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-500 shadow-md outline-none ${
                  idx === currentIndex 
                    ? 'bg-white scale-150 w-8 shadow-[0_0_15px_rgba(255,255,255,0.8)]' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
