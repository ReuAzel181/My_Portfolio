import { useState } from 'react';
import Image from 'next/image';
import HiddenGame from './HiddenGame';
// If framer-motion is available, import it:
// import { motion, AnimatePresence } from 'framer-motion';

// Improved coffee cup SVG icon - more cup-like appearance
const CoffeeCupIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Cup body - more realistic cup shape */}
    <path d="M5 9v8c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4v-8" stroke="#8B4513" strokeWidth="2" fill="#FFF8DC"/>
    {/* Coffee liquid */}
    <ellipse cx="12" cy="10" rx="6.5" ry="1.5" fill="#6F4E37"/>
    {/* Cup rim */}
    <ellipse cx="12" cy="9" rx="7" ry="1.5" fill="#FFF8DC" stroke="#8B4513" strokeWidth="1.5"/>
    {/* Cup handle */}
    <path d="M19 11c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5" stroke="#8B4513" strokeWidth="2" fill="none"/>
    {/* Cup base/saucer */}
    <ellipse cx="12" cy="21.5" rx="8" ry="1" fill="#D2B48C" stroke="#8B4513" strokeWidth="1"/>
  </svg>
);

// Coffee bean component using the actual image
const CoffeeBean = ({ className }: { className?: string }) => (
  <Image
    src="/others/coffee-bean.png"
    alt="Coffee bean"
    width={16}
    height={16}
    className={`${className} select-none`}
    draggable={false}
    style={{ width: '16px', height: '16px' }}
  />
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
      <div className="relative flex flex-col items-center w-full">
        {/* QR code card - Absolutely positioned overlay */}
        <div
          id="qr-section"
          className={`absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col items-center transition-all duration-300 z-20 ${showQR ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-2 pointer-events-none'}`}
          style={{ transformOrigin: 'bottom center' }}
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
      <HiddenGame isVisible={showGame} onClose={() => setShowGame(false)} />
    </>
  );
}

// Add a simple fade-in animation for the QR card
// Add this to your global CSS if you want a smooth effect:
// .animate-fade-in { animation: fadeIn 0.2s ease; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }