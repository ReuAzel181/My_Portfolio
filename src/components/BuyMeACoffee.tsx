import { useState } from 'react';
import Image from 'next/image';
import HiddenGame from './HiddenGame';
// If framer-motion is available, import it:
// import { motion, AnimatePresence } from 'framer-motion';

// Modern coffee cup SVG icon
const CoffeeCupIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="4" y="8" width="14" height="8" rx="4" fill="#fff" stroke="#a0522d" strokeWidth="2"/>
    <rect x="6" y="6" width="10" height="4" rx="2" fill="#fff8f0" stroke="#a0522d" strokeWidth="1.5"/>
    <rect x="7" y="16" width="8" height="2" rx="1" fill="#a0522d"/>
    <path d="M18 10c2 0 2 4 0 4" stroke="#a0522d" strokeWidth="2" fill="none"/>
  </svg>
);

// Realistic coffee bean SVG (from SVG Repo, CC0)
const CoffeeBean = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <ellipse cx="32" cy="32" rx="28" ry="16" fill="#6f4e37"/>
    <path d="M32 10c8 16 8 28 0 44" stroke="#fff8f0" strokeWidth="3" strokeLinecap="round"/>
    <ellipse cx="32" cy="32" rx="28" ry="16" fill="url(#beanGradient)" fillOpacity="0.3"/>
    <defs>
      <radialGradient id="beanGradient" cx="0.5" cy="0.5" r="0.5" fx="0.3" fy="0.3">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#6f4e37" stopOpacity="0"/>
      </radialGradient>
    </defs>
  </svg>
);

export default function BuyMeACoffee() {
  const [showQR, setShowQR] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleCoffeeClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      // Show game after 5 rapid clicks
      if (newCount >= 5) {
        setShowGame(true);
        return 0; // Reset count
      }
      // Reset count if user waits too long between clicks
      setTimeout(() => setClickCount(0), 2000);
      return newCount;
    });
    setShowQR(v => !v);
  };

  return (
    <>
      <div className="fixed z-50 bottom-6 right-6 flex flex-col items-end">
        {/* QR code card with scale/fade animation */}
        <div
          id="qr-section"
          className={`mb-3 p-4 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col items-center transition-transform transition-opacity duration-300 ${showQR ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}
          style={{ transformOrigin: 'bottom right' }}
        >
          <span className="mb-2 text-gray-700 text-sm">Scan with GCash</span>
          <Image
            src="/others/qr.png"
            alt="GCash QR Code"
            width={160}
            height={160}
            style={{ width: 160, height: 'auto' }}
            className="rounded-md"
            priority
          />
        </div>
        <div className="relative flex flex-col items-center w-full">
          {/* Floating coffee beans animation on hover */}
          <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-[80px] h-[48px] flex justify-center pointer-events-none transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
               aria-hidden="true">
            <CoffeeBean className="bean bean-1" />
            <CoffeeBean className="bean bean-2" />
            <CoffeeBean className="bean bean-3" />
          </div>
          <button
            onClick={handleCoffeeClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 flex items-center gap-2"
            aria-expanded={showQR}
            aria-controls="qr-section"
          >
            <CoffeeCupIcon />
            Buy Me a Coffee
          </button>
        </div>
      </div>
      <HiddenGame isVisible={showGame} onClose={() => setShowGame(false)} />
    </>
  );
}

// Add a simple fade-in animation for the QR card
// Add this to your global CSS if you want a smooth effect:
// .animate-fade-in { animation: fadeIn 0.2s ease; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } } 