import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, collection, setDoc, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';

export default function ReviewModal({ isOpen, onClose, productData, currentUser, onReviewSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !productData) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
       alert("You can only upload a maximum of 3 images.");
       return;
    }
    setImages(prev => [...prev, ...files].slice(0, 3));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error("Missing Cloudinary configuration in environment variables.");
    }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);
    data.append('cloud_name', cloudName);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating first!");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload images sequentially
      const uploadedImageUrls = [];
      for (const img of images) {
        const url = await uploadToCloudinary(img);
        uploadedImageUrls.push(url);
      }

      // 2. Setup Review document ID
      const reviewId = `${productData.id}_${currentUser.uid}`;
      const reviewRef = doc(db, 'products', productData.id, 'reviews', reviewId);

      // 3. Prepare review payload
      const payload = {
        id: reviewId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Sparkle Client',
        userPhoto: currentUser.photoURL || '',
        rating,
        text: reviewText,
        images: uploadedImageUrls,
        likes: [],
        dislikes: [],
        adminReply: "",
        createdAt: serverTimestamp()
      };

      // 4. Save review
      await setDoc(reviewRef, payload);

      // 5. Update user's reviewedProducts array
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        reviewedProducts: arrayUnion(productData.id)
      });

      // 6. Recalculate and update the Product's average rating
      // This is a simplified calculation, normally done via cloud functions or transactions.
      const productRef = doc(db, 'products', productData.id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
         const data = productSnap.data();
         const currentCount = data.reviewCount || 0;
         const currentAvg = data.averageRating || 0;
         
         const newCount = currentCount + 1;
         const newAvg = ((currentAvg * currentCount) + rating) / newCount;

         // Keep it to 1 decimal place max (e.g. 4.5)
         const fixedAvg = Math.round(newAvg * 10) / 10;
         
         await updateDoc(productRef, {
            reviewCount: newCount,
            averageRating: fixedAvg
         });
      }
      
      onReviewSuccess(productData.id);
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Something went wrong while submitting your review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto bg-rose-950/40 backdrop-blur-sm pt-10 pb-10">
      <div className="relative w-full max-w-xl bg-white rounded-[2rem] border border-rose-100 shadow-[0_20px_50px_rgba(255,228,230,0.8)] overflow-hidden animate-springUp">
        
        <div className="p-6 md:p-8 border-b border-rose-50 flex justify-between items-center bg-rose-50/30">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-rose-950 leading-none mb-1">Rate & Review</h2>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">{productData.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-rose-100 flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
            <span className="text-2xl leading-none font-light">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-rose-900 mb-2">How would you rate this masterpiece?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                >
                  <svg 
                    className={`w-10 h-10 md:w-12 md:h-12 transition-colors duration-200 ${
                      (hoverRating || rating) >= star ? 'text-amber-400' : 'text-rose-100'
                    }`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="h-6 mt-1 flex items-center">
               {rating > 0 && <span className="text-sm font-black text-amber-500 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-100 uppercase tracking-widest">{['Poor', 'Fair', 'Good', 'Very Good', 'Masterpiece'][rating - 1]}</span>}
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 pl-1">Tell us more (Optional)</label>
             <textarea 
               value={reviewText}
               onChange={(e) => setReviewText(e.target.value)}
               placeholder="What did you love about it? Was it as sparkly as you expected?"
               className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-rose-950 font-medium placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all resize-none h-28 text-sm"
             />
          </div>

          <div>
             <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 pl-1 flex justify-between">
                <span>Attach Photos (Optional)</span>
                <span>{images.length}/3</span>
             </label>
             <div className="flex gap-4">
               {images.map((img, i) => (
                 <div key={i} className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shadow-sm border border-rose-100 group">
                   <img src={URL.createObjectURL(img)} alt="upload preview" className="w-full h-full object-cover" />
                   <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <span className="text-xl">&times;</span>
                   </button>
                 </div>
               ))}
               {images.length < 3 && (
                 <label className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-rose-200 hover:border-pink-400 hover:bg-pink-50 flex items-center justify-center cursor-pointer transition-all text-rose-300 hover:text-pink-500">
                    <span className="text-2xl">+</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                 </label>
               )}
             </div>
          </div>

          <div className="pt-4 border-t border-rose-50 flex gap-4">
             <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-4 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-colors w-1/3 border border-rose-100 bg-white shadow-sm">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black text-lg rounded-xl shadow-[0_10px_20px_rgba(244,114,182,0.3)] hover:shadow-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:active:scale-100">
               {isSubmitting ? <span className="animate-pulse">Submitting...</span> : 'Post Review'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
