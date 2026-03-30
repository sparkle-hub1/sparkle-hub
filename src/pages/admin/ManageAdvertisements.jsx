import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ConfirmActionModal from '../../components/ConfirmActionModal';

export default function ManageAdvertisements() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [advertToDelete, setAdvertToDelete] = useState(null);

  // Hero Slider States
  const [heroImages, setHeroImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [heroToDelete, setHeroToDelete] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    fetchHeroImages();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'announcements');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
      } else {
        await setDoc(docRef, { messages: [] });
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeroImages = async () => {
    try {
      const docRef = doc(db, 'settings', 'heroSlider');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setHeroImages(docSnap.data().images || []);
      } else {
        await setDoc(docRef, { images: [] });
      }
    } catch (err) {
      console.error("Error fetching hero images:", err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const updatedMessages = [...messages, newMessage.trim()];
      await setDoc(doc(db, 'settings', 'announcements'), { messages: updatedMessages }, { merge: true });
      setMessages(updatedMessages);
      setNewMessage('');
      showToast('Announcement added successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to add announcement.', 'error');
    }
  };

  const handleRemoveMessage = async () => {
    if (advertToDelete === null) return;
    try {
      const updatedMessages = messages.filter((_, index) => index !== advertToDelete);
      await setDoc(doc(db, 'settings', 'announcements'), { messages: updatedMessages }, { merge: true });
      setMessages(updatedMessages);
      showToast('Announcement removed successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove announcement.', 'error');
    } finally {
      setAdvertToDelete(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Cloudinary Upload Logic
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!data.secure_url) throw new Error('Cloudinary upload failed');

      const uniqueId = Date.now().toString();
      const newImage = { id: uniqueId, url: data.secure_url, public_id: data.public_id };
      const updatedImages = [...heroImages, newImage];

      await setDoc(doc(db, 'settings', 'heroSlider'), { images: updatedImages }, { merge: true });
      setHeroImages(updatedImages);
      showToast('Hero image uploaded successfully via Cloudinary!');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image.', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteHero = async () => {
    if (!heroToDelete) return;

    try {
      // Remove from Firestore array (We can't securely delete from Cloudinary direct from client without a signed signature in most setups, so we just remove the frontend reference).
      const updatedImages = heroImages.filter(img => img.id !== heroToDelete.id);
      await setDoc(doc(db, 'settings', 'heroSlider'), { images: updatedImages }, { merge: true });
      
      setHeroImages(updatedImages);
      showToast('Hero image deleted successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete image.', 'error');
    } finally {
      setHeroToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 sm:pt-8 animate-fade-in-up">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white font-bold text-sm transform transition-all duration-300 animate-fade-in-up ${
          toast.type === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
        }`}>
          <span className="text-xl">{toast.type === 'error' ? '❌' : '✨'}</span>
          {toast.message}
        </div>
      )}

      <div className="mb-8 sm:mb-10 text-center sm:text-left text-rose-950 px-2 sm:px-0">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 italic tracking-tight">Announcement Bar</h1>
        <p className="text-rose-800/80 font-medium text-sm sm:text-base leading-relaxed">Control the scrolling "breaking news" taglines seen at the top of Sparkle Hub.</p>
      </div>

      <div className="bg-white/80 border border-white rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(255,228,230,0.5)] backdrop-blur-md mb-10">
        <form onSubmit={handleAddMessage} className="flex flex-col md:flex-row gap-4 mb-8 sm:mb-10">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="E.g. Free shipping on PKR 5000+!"
            className="flex-1 bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3.5 sm:py-4 text-rose-900 focus:outline-none focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all font-bold placeholder-rose-200 text-sm sm:text-base outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-full md:w-auto px-8 py-3.5 sm:py-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl font-black shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95"
          >
            Add Tagline
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-rose-50/50 rounded-2xl border border-rose-100 border-dashed">
            <span className="text-4xl block mb-4">📢</span>
            <h3 className="text-rose-950 font-black text-xl mb-2">No active announcements</h3>
            <p className="text-rose-800/70 text-sm font-medium">Add your first tagline above. It will instantly appear at the top of Sparkle Hub.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest pl-2 mb-4">Active Taglines ({messages.length})</h3>
            {messages.map((msg, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white border border-rose-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 pr-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-black text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <p className="font-bold text-rose-950 text-sm sm:text-base">{msg}</p>
                </div>
                <button
                  onClick={() => setAdvertToDelete(idx)}
                  className="w-10 h-10 shrink-0 bg-rose-50 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl flex items-center justify-center transition-all focus:outline-none"
                  title="Remove Tagline"
                >
                  <span className="text-2xl leading-none -mt-1">&times;</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- HERO SLIDER SECTION --- */}
      <div className="mb-8 sm:mb-10 text-center sm:text-left text-rose-950 mt-16 px-2 sm:px-0">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 italic tracking-tight">Main Showcase Slider</h1>
        <p className="text-rose-800/80 font-medium text-sm sm:text-base leading-relaxed">Upload high-resolution landscape images for the Homepage main banner.</p>
      </div>

      <div className="bg-white/80 border border-white rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(255,228,230,0.5)] backdrop-blur-md mb-10">
         <div className="mb-8 p-6 sm:p-8 bg-rose-50/50 border-2 border-dashed border-rose-200 rounded-2xl text-center relative hover:bg-rose-50 transition-colors">
            {uploadingImage ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-rose-800 font-bold">Uploading to Database Securely...</p>
                </div>
            ) : (
                <>
                  <span className="text-4xl block mb-3">📸</span>
                  <h3 className="font-black text-rose-950 text-lg sm:text-xl mb-2">Upload New Media</h3>
                  <p className="text-rose-800/70 font-medium text-[10px] sm:text-xs mb-6 uppercase tracking-widest leading-relaxed">Landscape (1920x1080) Recommended</p>
                  <label className="cursor-pointer inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl font-black shadow-lg shadow-pink-200 transition-all hover:-translate-y-1 hover:shadow-xl focus-within:ring-4 focus-within:ring-pink-100 active:scale-95">
                    Choose Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </>
            )}
         </div>

         {heroImages.length > 0 && (
            <div>
               <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest pl-2 mb-4">Active Slider Images ({heroImages.length})</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {heroImages.map(img => (
                    <div key={img.id} className="relative aspect-video rounded-2xl overflow-hidden shadow-sm group border border-rose-100">
                      <img src={img.url} alt="Hero Slider" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                         <button
                           onClick={() => setHeroToDelete(img)}
                           className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xl transform scale-75 group-hover:scale-100 transition-all outline-none"
                           title="Delete Photo"
                         >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                    </div>
                 ))}
               </div>
            </div>
         )}
      </div>

      {/* Confirmation Modal for Announcements */}
      <ConfirmActionModal 
        isOpen={advertToDelete !== null}
        onClose={() => setAdvertToDelete(null)}
        onConfirm={handleRemoveMessage}
        title="Delete Advertisement?"
        message="Are you sure you want to permanently delete this tagline? It will instantly disappear from the public website."
        confirmText="Remove Tagline"
        confirmColor="rose"
      />

      {/* Confirmation Modal for Hero Images */}
      <ConfirmActionModal 
        isOpen={heroToDelete !== null}
        onClose={() => setHeroToDelete(null)}
        onConfirm={handleDeleteHero}
        title="Delete Slider Image?"
        message="Are you sure you want to permanently delete this photo? It will instantly disappear from the Home page slider."
        confirmText="Delete Photo"
        confirmColor="red"
      />
    </div>
  );
}
