import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWelcomeEmail } from '../utils/emailService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, fullName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Set Firebase displayName
    await updateProfile(user, { displayName: fullName });
    // Create Firestore user document
    await setDoc(doc(db, 'users', user.uid), {
      name: fullName,
      email: email,
      role: 'Customer',
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // Send professional welcome email
    try {
      await sendWelcomeEmail(email, fullName);
    } catch (err) {
      console.error("Welcome email failed:", err);
    }

    return userCredential;
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // REVERTED TO POPUP with more stability for local debugging
  async function loginWithGoogle() {
    console.log("Initiating Google Sign-In via Popup...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Login SUCCESS:", result.user.email);
      // Logic for user doc creation is handled in onAuthStateChanged for maximum stability
      return result;
    } catch (error) {
      console.error("Google Login Catch Error:", error.code, error.message);
      throw error;
    }
  }

  useEffect(() => {
    console.log("AuthProvider: initializing onAuthStateChanged...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed: ", user ? user.email : "NO USER");
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          console.log("Checking Firestore for user:", user.uid);
          
          let userSnap = await getDoc(userDocRef);
          
          if (!userSnap.exists()) {
            console.log("Creating NEW Firestore document for:", user.email);
            const name = user.displayName || 'Google User';
            const userData = {
              name: name,
              email: user.email,
              role: 'Customer',
              createdAt: new Date().toISOString(),
            };
            
            await setDoc(userDocRef, userData, { merge: true });
            console.log("Firestore Document CREATED SUCCESSFULLY.");
            
            // Re-fetch snap for isAdmin check
            userSnap = await getDoc(userDocRef);

            // Send Welcome Email
            try {
              console.log("Sending Welcome Email...");
              await sendWelcomeEmail(user.email, name);
              console.log("Welcome Email SENT.");
            } catch (emailErr) {
              console.error("Welcome email FAILED:", emailErr);
            }
          } else {
            console.log("Existing user detected. Role:", userSnap.data().role);
          }

          // Set Admin Status
          if (userSnap.exists() && userSnap.data().role === 'Admin') {
            setIsAdmin(true);
            console.log("User verified as ADMIN.");
          } else {
            setIsAdmin(false);
          }

          setCurrentUser(user);
        } catch (error) {
          console.error("Firestore Logic Error:", error);
          setIsAdmin(false);
          setCurrentUser(user); // Still allow login, even if Firestore fails for now
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      
      console.log("Finalizing Auth Loading State...");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    login,
    signup,
    logout,
    resetPassword,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
