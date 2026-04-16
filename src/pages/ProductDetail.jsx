import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

function StarDisplay({ rating, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-6 h-6 md:w-8 md:h-8' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`${sz} ${s <= Math.round(rating) ? 'text-amber-400' : 'text-rose-100'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [guestToast, setGuestToast] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
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
          if (data.variations && data.variations.length > 0) setSelectedVariation(data.variations[0]);
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

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const q = query(collection(db, 'products', id, 'reviews'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Could not fetch reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  const handleLikeDislike = async (review, type) => {
    if (!currentUser) { navigate('/login'); return; }
    const uid = currentUser.uid;
    const reviewRef = doc(db, 'products', id, 'reviews', review.id);
    const hasLiked = review.likes?.includes(uid);
    const hasDisliked = review.dislikes?.includes(uid);

    let update = {};
    if (type === 'like') {
      update = hasLiked
        ? { likes: arrayRemove(uid) }
        : { likes: arrayUnion(uid), dislikes: arrayRemove(uid) };
    } else {
      update = hasDisliked
        ? { dislikes: arrayRemove(uid) }
        : { dislikes: arrayUnion(uid), likes: arrayRemove(uid) };
    }
    await updateDoc(reviewRef, update);
    // Optimistic UI Update
    setReviews(prev => prev.map(r => {
      if (r.id !== review.id) return r;
      let newLikes = [...(r.likes || [])];
      let newDislikes = [...(r.dislikes || [])];
      if (type === 'like') {
        if (hasLiked) newLikes = newLikes.filter(u => u !== uid);
        else { newLikes.push(uid); newDislikes = newDislikes.filter(u => u !== uid); }
      } else {
        if (hasDisliked) newDislikes = newDislikes.filter(u => u !== uid);
        else { newDislikes.push(uid); newLikes = newLikes.filter(u => u !== uid); }
      }
      return { ...r, likes: newLikes, dislikes: newDislikes };
    }));
  };

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
      setTimeout(() => { setGuestToast(false); navigate('/login'); }, 1800);
      return;
    }
    const variationSuffix = selectedVariation ? `-${selectedVariation.toLowerCase().replace(/\s+/g, '-')}` : '';
    const cartItemId = `${product.id}${variationSuffix}`;
    addItem({ ...product, id: cartItemId, variation: selectedVariation });
  };

  const avgRating = product.averageRating || 0;
  const reviewCount = product.reviewCount || 0;

  return (
    <div className="max-w-6xl mx-auto w-full pt-4 md:pt-10 text-rose-950">
      <SEO
        title={product.name}
        description={product.description}
        keywords={`resin ${product.name}, ${product.category}, customized resin art, buy ${product.name} pakistan`}
        image={product.image}
      />

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
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="aspect-square bg-rose-50 rounded-[2rem] border border-rose-100 overflow-hidden shadow-inner relative group z-10">
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
        
        <div className="flex flex-col justify-center z-10 pl-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-200 shadow-sm">{product.category || 'Resin Art'}</span>
            {product.inStock !== false ? (
              <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                In Stock
              </span>
            ) : (
              <span className="flex items-center gap-2 text-rose-500 font-bold text-sm tracking-widest uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                Sold Out
              </span>
            )}
            {reviewCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                <StarDisplay rating={avgRating} size="sm" />
                <span className="text-xs font-black text-amber-600">{avgRating.toFixed(1)}</span>
                <span className="text-[10px] font-bold text-amber-400">({reviewCount})</span>
              </div>
            )}
          </div>
          
          <h1 className="text-3xl lg:text-5xl font-black mb-4 text-rose-950 leading-tight drop-shadow-sm">{product.name}</h1>
          
          {product.discount > 0 ? (
            <div className="flex items-end gap-4 mb-3">
              <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 drop-shadow-sm">PKR {Math.floor(product.price * (1 - product.discount / 100))}</p>
              <p className="text-xl font-bold text-rose-300 line-through pb-1">PKR {product.price}</p>
              <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-sm font-black mb-1.5 border border-rose-100 shadow-sm inline-block">Save {product.discount}%</span>
            </div>
          ) : (
            <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-3 drop-shadow-sm">PKR {product.price}</p>
          )}
          
          <div className="flex items-center gap-3 mb-8">
            {(product.deliveryCharge === 0 || product.deliveryCharge === undefined) ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-sm font-bold shadow-sm">🎁 Free Delivery</span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-bold shadow-sm">🚚 Delivery: PKR {product.deliveryCharge}</span>
            )}
          </div>
          
          <p className="text-base text-rose-800/80 leading-relaxed mb-8 font-medium border-l-4 border-pink-300 pl-5 rounded-sm">{product.description}</p>
          
          {product.variations && product.variations.length > 0 && (
            <div className="mb-8 p-5 sm:p-8 bg-rose-50/50 border border-rose-100 rounded-[2rem] shadow-inner">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-5 flex items-center gap-3">
                Select Variation
                <div className="h-px flex-1 bg-gradient-to-r from-rose-200 to-transparent"></div>
              </h3>
              <div className="flex flex-wrap gap-4">
                {product.variations.map(variation => (
                  <button key={variation} onClick={() => setSelectedVariation(variation)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all border ${selectedVariation === variation ? 'bg-gradient-to-r from-pink-400 to-rose-400 border-transparent shadow-[0_10px_20px_rgba(244,114,182,0.4)] text-white scale-105' : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-pink-300 shadow-sm'}`}
                  >{variation}</button>
                ))}
              </div>
            </div>
          )}
          
          {product.inStock !== false ? (
            <button onClick={handleAddToCart} className="w-full py-5 lg:py-6 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-2xl font-black text-xl lg:text-2xl shadow-[0_15px_30px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(244,114,182,0.4)] flex items-center justify-center gap-3 text-white focus:outline-none">
              Add to Cart <span className="text-2xl font-light">&rarr;</span>
            </button>
          ) : (
            <button disabled className="w-full py-5 lg:py-6 bg-rose-100 text-rose-400 border-2 border-rose-200 rounded-2xl font-black text-xl lg:text-2xl flex items-center justify-center gap-3 cursor-not-allowed">
              Out of Stock <span className="text-3xl font-light leading-none opacity-50">&times;</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Reviews Section ─── */}
      <div className="mt-12 mb-20">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black text-rose-950">Customer Reviews</h2>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2">
              <StarDisplay rating={avgRating} size="md" />
              <span className="font-black text-amber-600 text-lg">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-amber-400 font-bold">/ 5 · {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="h-px flex-1 bg-gradient-to-r from-rose-200 to-transparent"></div>
        </div>

        {reviewsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white/70 border border-rose-50 rounded-[2rem] p-10 text-center shadow-sm">
            <span className="text-5xl block mb-4">✨</span>
            <p className="text-rose-900 font-black text-xl mb-1">No reviews yet</p>
            <p className="text-rose-400 text-sm font-medium">Be the first to share your experience after purchase!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map(review => {
              const hasLiked = review.likes?.includes(currentUser?.uid);
              const hasDisliked = review.dislikes?.includes(currentUser?.uid);
              const dateStr = review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
              return (
                <div key={review.id} className="bg-white/90 border border-rose-50 rounded-[1.5rem] p-5 sm:p-7 shadow-[0_4px_20px_rgba(255,228,230,0.5)] hover:shadow-[0_8px_30px_rgba(255,228,230,0.7)] transition-all">
                  {/* Reviewer Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} alt={review.userName} className="w-11 h-11 rounded-full object-cover border-2 border-rose-100 shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm">
                        {review.userName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-black text-rose-950 text-sm">{review.userName || 'Sparkle Client'}</p>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Verified Purchase ✓</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={review.rating} size="sm" />
                        {dateStr && <span className="text-[10px] text-rose-300 font-bold">{dateStr}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.text && (
                    <p className="text-rose-800/80 text-sm font-medium leading-relaxed mb-4">{review.text}</p>
                  )}

                  {/* Review Images */}
                  {review.images?.length > 0 && (
                    <div className="flex gap-3 mb-4 flex-wrap">
                      {review.images.map((imgUrl, i) => (
                        <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-rose-100 hover:scale-105 transition-transform shadow-sm block">
                          <img src={imgUrl} alt="Review" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Like / Dislike */}
                  <div className="flex items-center gap-3 pt-3 border-t border-rose-50">
                    <button
                      onClick={() => handleLikeDislike(review, 'like')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border active:scale-95 ${hasLiked ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-white text-rose-400 border-rose-100 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      {review.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => handleLikeDislike(review, 'dislike')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border active:scale-95 ${hasDisliked ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-white text-rose-300 border-rose-100 hover:bg-rose-50'}`}
                    >
                      <svg className="w-4 h-4" fill={hasDisliked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      {review.dislikes?.length || 0}
                    </button>
                    {!currentUser && (
                      <span className="text-[10px] text-rose-300 font-bold ml-auto">Login to vote</span>
                    )}
                  </div>

                  {/* Admin Reply */}
                  {review.adminReply && (
                    <div className="mt-4 p-4 bg-rose-50/70 border border-rose-100 rounded-xl">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span>💎</span> Official Reply from Sparkle Hub
                      </p>
                      <p className="text-sm text-rose-800/90 font-medium leading-relaxed">{review.adminReply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
