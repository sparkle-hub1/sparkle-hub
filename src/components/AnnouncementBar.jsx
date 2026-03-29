import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function AnnouncementBar() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen to changes in real-time
    const unsubscribe = onSnapshot(doc(db, 'settings', 'announcements'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages) {
        setMessages(docSnap.data().messages);
      }
    }, (error) => {
      console.error("Error fetching announcements:", error);
    });

    return () => unsubscribe();
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600 text-white w-full overflow-hidden whitespace-nowrap py-2 sm:py-2.5 shadow-sm relative z-50 flex items-center">
      <div className="flex animate-marquee min-w-max hover:[animation-play-state:paused]">
        {/* Render 10 times to ensure it overflows the screen for seamless -50% translations */}
        {[...Array(10)].map((_, blockIndex) => (
          <div key={blockIndex} className="flex min-w-max justify-around">
            {messages.map((message, index) => (
              <span key={`${blockIndex}-${index}`} className="mx-6 sm:mx-12 font-bold text-xs sm:text-sm tracking-wide lowercase" style={{ fontVariant: 'small-caps' }}>
                {message}
                <span className="ml-12 sm:ml-24 text-pink-200/50">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
