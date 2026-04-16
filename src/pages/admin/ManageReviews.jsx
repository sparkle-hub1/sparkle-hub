import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function ManageReviews() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyTexts, setReplyTexts] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, 'products'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
      const cats = ['All', ...new Set(list.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    };
    fetchProducts();
  }, []);

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setReviewsLoading(true);
    setReviews([]);
    try {
      const q = query(collection(db, 'products', product.id, 'reviews'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReply = async (review) => {
    const replyText = replyTexts[review.id]?.trim();
    if (!replyText) return;
    setSubmitting(review.id);
    try {
      const reviewRef = doc(db, 'products', selectedProduct.id, 'reviews', review.id);
      await updateDoc(reviewRef, { adminReply: replyText });
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, adminReply: replyText } : r));
      setReplyTexts(prev => ({ ...prev, [review.id]: '' }));
      showToast('Reply posted successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(null);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/50 to-rose-100/30 p-4 sm:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-3">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="w-10 h-10 rounded-full border border-rose-100 bg-white flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-rose-950">Manage Reviews</h1>
            <p className="text-rose-400 text-sm font-medium">View and reply to customer reviews per product</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Product List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                    selectedCategory === cat
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-white text-rose-500 border-rose-100 hover:border-pink-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full text-left bg-white border rounded-2xl p-3 flex items-center gap-3 transition-all shadow-sm hover:shadow-md group ${
                    selectedProduct?.id === product.id ? 'border-rose-400 ring-2 ring-rose-200' : 'border-rose-50 hover:border-rose-200'
                  }`}
                >
                  <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover border border-rose-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-rose-950 text-sm truncate group-hover:text-pink-600 transition-colors">{product.name}</p>
                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">{product.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {product.averageRating > 0 ? (
                        <>
                          <StarDisplay rating={product.averageRating} />
                          <span className="text-xs font-black text-amber-500">{product.averageRating.toFixed(1)}</span>
                          <span className="text-[10px] text-rose-300 font-bold">({product.reviewCount})</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-rose-300 font-bold">No reviews yet</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Reviews Panel */}
          <div className="lg:col-span-3">
            {!selectedProduct ? (
              <div className="bg-white/70 border border-rose-50 rounded-[2rem] p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
                <span className="text-6xl mb-4 block">💬</span>
                <p className="text-rose-900 font-black text-xl mb-2">Select a Product</p>
                <p className="text-rose-400 text-sm">Click any product on the left to view its reviews</p>
              </div>
            ) : (
              <div className="bg-white/80 border border-rose-50 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-rose-50">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-xl object-cover border border-rose-100 shadow-sm" />
                  <div>
                    <h2 className="font-black text-rose-950 text-lg leading-tight">{selectedProduct.name}</h2>
                    <p className="text-rose-400 text-xs font-bold uppercase tracking-widest">{selectedProduct.category}</p>
                    {selectedProduct.averageRating > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <StarDisplay rating={selectedProduct.averageRating} />
                        <span className="text-sm font-black text-amber-500">{selectedProduct.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-rose-300 font-bold">· {selectedProduct.reviewCount} review{selectedProduct.reviewCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-rose-300 font-bold text-lg">No reviews for this product yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
                    {reviews.map(review => {
                      const dateStr = review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                      return (
                        <div key={review.id} className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 sm:p-5">
                          {/* Reviewer */}
                          <div className="flex items-start gap-3 mb-3">
                            {review.userPhoto ? (
                              <img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full object-cover border-2 border-rose-100 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-white font-black text-base shrink-0">
                                {review.userName?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-rose-950 text-sm">{review.userName || 'Unknown User'}</p>
                                {dateStr && <span className="text-[10px] text-rose-300 font-bold">{dateStr}</span>}
                              </div>
                              <StarDisplay rating={review.rating} />
                            </div>
                          </div>

                          {review.text && <p className="text-rose-800/80 text-sm font-medium mb-3 leading-relaxed">{review.text}</p>}

                          {review.images?.length > 0 && (
                            <div className="flex gap-2 mb-3 flex-wrap">
                              {review.images.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-xl overflow-hidden border border-rose-100 hover:scale-105 transition-transform block shadow-sm">
                                  <img src={url} alt="review" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Existing Admin Reply */}
                          {review.adminReply && (
                            <div className="bg-white border border-rose-100 rounded-xl p-3 mb-3">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">💎 Your Reply</p>
                              <p className="text-sm text-rose-700 font-medium">{review.adminReply}</p>
                            </div>
                          )}

                          {/* Reply Input */}
                          <div className="flex gap-2 mt-3">
                            <input
                              type="text"
                              placeholder={review.adminReply ? "Edit your reply..." : "Write an official reply..."}
                              value={replyTexts[review.id] || ''}
                              onChange={e => setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleReply(review)}
                              className="flex-1 bg-white border border-rose-100 rounded-xl px-3 py-2 text-sm text-rose-950 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all font-medium"
                            />
                            <button
                              onClick={() => handleReply(review)}
                              disabled={submitting === review.id || !replyTexts[review.id]?.trim()}
                              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all shadow-sm disabled:opacity-50 active:scale-95 whitespace-nowrap"
                            >
                              {submitting === review.id ? '...' : 'Reply'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
