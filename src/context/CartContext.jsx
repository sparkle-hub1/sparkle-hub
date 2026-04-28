import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_CART: 'SET_CART',
  SET_ACTIVE_ORDER: 'SET_ACTIVE_ORDER',
  CLEAR_ACTIVE_ORDER: 'CLEAR_ACTIVE_ORDER'
};

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const existingItem = state.find(item => item.id === action.payload.id);
      if (existingItem) {
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { ...action.payload, quantity: 1 }];
    }
    case ACTIONS.REMOVE_ITEM:
      return state.filter(item => item.id !== action.payload.id);
    case ACTIONS.UPDATE_QUANTITY:
      return state.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    case ACTIONS.CLEAR_CART:
      return [];
    case ACTIONS.SET_CART:
      return action.payload;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [toast, setToast] = useState({ show: false, message: '', image: '' });
  const [toastTimer, setToastTimer] = useState(null);
  const [customPictures, setCustomPictures] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // ── Hydrate and Manage Session State ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSynced(false); // Reset sync state for new user
        try {
          // 1. Try to fetch from Firestore (Source of Truth for Cross-Device)
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          let cloudData = null;
          if (userDoc.exists() && userDoc.data().cartData) {
            cloudData = userDoc.data().cartData;
            
            // Hydrate from Cloud
            if (cloudData.cart) dispatch({ type: ACTIONS.SET_CART, payload: cloudData.cart });
            else dispatch({ type: ACTIONS.CLEAR_CART });
            
            if (cloudData.customPictures) setCustomPictures(cloudData.customPictures);
            else setCustomPictures([]);
            
            if (cloudData.activeOrderId) setActiveOrderId(cloudData.activeOrderId);
            else setActiveOrderId(null);
          } else {
            // 2. Fallback to Local Storage if no cloud data exists yet (Migration)
            const savedCart = localStorage.getItem(`sparklehub_cart_${user.uid}`);
            if (savedCart) dispatch({ type: ACTIONS.SET_CART, payload: JSON.parse(savedCart) });
            else dispatch({ type: ACTIONS.CLEAR_CART });

            const savedPics = localStorage.getItem(`sparklehub_pics_${user.uid}`);
            if (savedPics) setCustomPictures(JSON.parse(savedPics));
            else setCustomPictures([]);

            const savedDraft = localStorage.getItem(`sparklehub_draft_${user.uid}`);
            if (savedDraft) setActiveOrderId(savedDraft);
            else setActiveOrderId(null);
          }
        } catch (error) {
          console.error("Cart Hydration Error", error);
        } finally {
          setIsCloudSynced(true); // Hydration complete, safe to write to cloud now
        }
      } else {
        dispatch({ type: ACTIONS.CLEAR_CART });
        setCustomPictures([]);
        setActiveOrderId(null);
        setIsCloudSynced(false);
      }
      setIsInitialized(true);
    });
    return unsubscribe;
  }, []);

  // ── Persist to Local Storage AND Cloud (Firestore) ──
  useEffect(() => {
    if (isInitialized && currentUser && isCloudSynced) {
      // 1. Save locally for offline speed
      localStorage.setItem(`sparklehub_cart_${currentUser.uid}`, JSON.stringify(cart));
      localStorage.setItem(`sparklehub_pics_${currentUser.uid}`, JSON.stringify(customPictures));
      
      if (activeOrderId) {
        localStorage.setItem(`sparklehub_draft_${currentUser.uid}`, activeOrderId);
      } else {
        localStorage.removeItem(`sparklehub_draft_${currentUser.uid}`);
      }

      // 2. Sync to Firestore for Cross-Device Persistence
      const syncToCloud = async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            cartData: {
              cart,
              customPictures,
              activeOrderId
            }
          }, { merge: true });
        } catch (error) {
          console.error("Failed to sync cart to cloud:", error);
        }
      };
      
      // Debounce the cloud write slightly to avoid spamming Firestore on rapid quantity changes
      const timeoutId = setTimeout(syncToCloud, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [cart, customPictures, activeOrderId, currentUser, isInitialized, isCloudSynced]);

  const addItem = (item) => {
    // Core protection: reject out-of-stock items at the context level
    if (item.inStock === false) return;

    // Apply discount logic directly map it to the price
    const finalPrice = item.discount > 0 ? Math.floor(item.price * (1 - item.discount / 100)) : item.price;
    const cartItem = { ...item, originalPrice: item.price, price: finalPrice };

    dispatch({ type: ACTIONS.ADD_ITEM, payload: cartItem });

    // Global Add to Cart Toast
    setToast({
      show: true,
      message: item.name,
      image: item.image
    });

    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2500);
    setToastTimer(timer);
  };

  const removeItem = (id) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: { id } });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      dispatch({ type: ACTIONS.UPDATE_QUANTITY, payload: { id, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: ACTIONS.CLEAR_CART });
    setCustomPictures([]);
    setActiveOrderId(null); // Clear the active draft completely upon completion
  };

  const addCustomPicture = (url) => {
    if (customPictures.length < 5) {
      setCustomPictures(prev => [...prev, url]);
    }
  };

  const removeCustomPicture = (indexToRemove) => {
    setCustomPictures(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const value = {
    cart,
    cartTotal,
    cartCount,
    customPictures,
    activeOrderId,
    setActiveOrderId,
    addCustomPicture,
    removeCustomPicture,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Global Add to Cart Toast */}
      {toast.show && (
        <div className="fixed top-24 sm:top-28 right-4 sm:right-8 z-[100] bg-white/95 backdrop-blur-xl border border-rose-100 shadow-[0_20px_50px_rgba(255,228,230,0.8)] rounded-[1.5rem] p-4 flex items-center gap-4 animate-fade-in-up w-[calc(100vw-32px)] sm:w-80 group">
          <div className="w-14 h-14 shrink-0 rounded-[1rem] overflow-hidden border border-rose-50 bg-rose-50/50 shadow-inner">
            <img src={toast.image} alt={toast.message} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="flex-1 pr-2">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              Added to Cart
            </p>
            <p className="text-sm font-bold text-rose-950 truncate leading-tight">{toast.message}</p>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}
