import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-rose-50 text-rose-950 selection:bg-pink-400 selection:text-white relative overflow-x-hidden">
      {/* Elegant Pastel Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 md:w-[600px] md:h-[600px] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 md:w-[600px] md:h-[600px] bg-rose-300/30 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="sticky top-0 z-50 flex flex-col w-full shadow-sm">
        <AnnouncementBar />
        <Navbar />
      </div>
      
      {/* Content padding to offset fixed Navbar */}
      <main className="flex-grow z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex flex-col">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
