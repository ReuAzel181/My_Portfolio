import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import { TITLE_SIZES } from '@/lib/designTokens';

const images = [
  '/ui-projects/Asenso.png',
  '/ui-projects/ByteBean/ByteBean.png',
  '/ui-projects/Fidget.png',
  '/ui-projects/Poster.png',
  '/ui-projects/Youtube Thumbnail.png',
  '/ui-projects/AI - Secretary.png',
  '/ui-projects/News Site.png',
  '/ui-projects/QuizGame.png',
  '/ui-projects/Translator.png',
  '/ui-projects/Wine Recommender.png',
];

const youtubeDeckImages = [
  '/ui-projects/Youtube Thumbnail/Youtube Thumbnail.png',
  '/ui-projects/Youtube Thumbnail/Youtube Thumbnail 1.png',
  '/ui-projects/Youtube Thumbnail/Youtube Thumbnail 2.png',
];

const byteBeanDeckImages = [
  '/ui-projects/ByteBean/ByteBean.png',
  '/ui-projects/ByteBean/ByteBean 1.png',
  '/ui-projects/ByteBean/ByteBean 2.png',
];

const IMAGE_WIDTH = 260; // Balanced card width
const IMAGE_HEIGHT = 160; // Balanced card height
const GAP = 32; // gap-8 in px
const ROW_LENGTH = images.length * 2;
const TOTAL_WIDTH = ROW_LENGTH * IMAGE_WIDTH + (ROW_LENGTH - 1) * GAP;
const SINGLE_ROW_WIDTH = images.length * IMAGE_WIDTH + (images.length - 1) * GAP;

export default function HorizontalScroller() {
  const rowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTarget = useRef(0);
  const scrollCurrent = useRef(0);
  const animationFrame = useRef(0);

  // Center images by default (using single row width)
  useEffect(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const initialScroll = (SINGLE_ROW_WIDTH - containerWidth) / 2;
    scrollTarget.current = initialScroll;
    scrollCurrent.current = initialScroll;
    updateRow(initialScroll);
  }, []);

  // Smooth animation loop with infinite looping
  useEffect(() => {
    function animate() {
      scrollCurrent.current += (scrollTarget.current - scrollCurrent.current) * 0.12;
      // Infinite loop logic
      if (scrollCurrent.current < 0) {
        scrollCurrent.current += SINGLE_ROW_WIDTH;
        scrollTarget.current += SINGLE_ROW_WIDTH;
      } else if (scrollCurrent.current > SINGLE_ROW_WIDTH) {
        scrollCurrent.current -= SINGLE_ROW_WIDTH;
        scrollTarget.current -= SINGLE_ROW_WIDTH;
      }
      updateRow(scrollCurrent.current);
      animationFrame.current = requestAnimationFrame(animate);
    }
    animationFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame.current);
  }, []);

  // Global scroll listener (no preventDefault)
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (isInViewport) {
        scrollTarget.current += e.deltaY * 1.2;
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
    };
  }, []);

  // Update row transform
  function updateRow(scroll: number) {
    if (rowRef.current) {
      rowRef.current.style.transform = `translateX(${-scroll}px)`;
    }
  }

  // Shuffle images array for random order
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Store shuffled images in state
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);
  useEffect(() => {
    setShuffledImages(shuffleArray(images));
  }, []);

  return (
    <div>
      <section
        ref={containerRef}
        className="relative w-full min-h-[500px] py-32 flex flex-col items-center justify-center overflow-visible"
        style={{
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
          boxShadow: '0 20px 60px 0 rgba(31, 38, 135, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          zIndex: 1,
          overflow: 'hidden',
          maxWidth: '100vw',
        }}
      >
      {/* Enhanced Section Title with Better Spacing */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none select-none">
        {/* Main Title with Enhanced Visibility */}
        <div className="relative mb-6">
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/30 to-pink-400/20 blur-xl rounded-full scale-150" />
          
          {/* Main title */}
          <h2 className="relative font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 tracking-tight leading-tight" style={{ fontSize: TITLE_SIZES.SECTION }}>
            Design & Graphics
          </h2>
          
          {/* Subtle text shadow for depth */}
          <div className="absolute inset-0 text-4xl md:text-6xl lg:text-7xl font-black text-white/5 blur-sm">
            Design & Graphics
          </div>
        </div>
        
        {/* Enhanced Subtitle */}
        <div className="relative">
          <p className="text-white/90 font-medium tracking-wide mb-2" style={{ fontSize: '18px' }}>
            A dynamic, immersive gallery
          </p>
          <p className="text-white/60 font-light italic" style={{ fontSize: '18px' }}>
            Scroll to explore my creative journey
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
        </div>
      </div>

      {/* Enhanced Gallery Row with Better Positioning */}
      <div
        ref={rowRef}
        className="flex gap-8 absolute left-0 z-20"
        style={{ 
          pointerEvents: 'auto', 
          width: TOTAL_WIDTH, 
          maxWidth: '100vw', 
          top: '280px', // Increased spacing from title
          transform: 'translateY(-50%)'
        }}
      >
        {[...(shuffledImages.length ? shuffledImages : images), ...(shuffledImages.length ? shuffledImages : images)].map((src, i) => {
          // Extract image name without extension and path
          const name = src.split('/').pop()?.replace(/\.[^/.]+$/, '') ?? '';
          // Special deck shuffle for Youtube Thumbnail
          if (src === '/ui-projects/Youtube Thumbnail.png') {
            return (
              <YoutubeThumbnailDeck key={src + i} />
            );
          }
          // Special deck shuffle for ByteBean
          if (src === '/ui-projects/ByteBean/ByteBean.png') {
            return (
              <ByteBeanDeck key={src + i} />
            );
          }
          return (
            <div
              key={src + i}
              className="relative group flex flex-col items-center justify-end"
              style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
            >
              {/* Enhanced name overlay with better styling */}
              <span
                className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-sm text-white text-sm font-bold opacity-0 group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 pointer-events-none select-none shadow-2xl z-30 border border-white/10"
                style={{ whiteSpace: 'nowrap' }}
              >
                {name}
                {/* Small arrow pointing down */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95" />
              </span>
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
              >
                <Image
                  src={src}
                  alt={`Project ${i % images.length + 1}`}
                  width={IMAGE_WIDTH}
                  height={IMAGE_HEIGHT}
                  className="select-none object-contain rounded-xl border-2 border-white/20 shadow-2xl bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-3xl group-hover:border-white/40"
                  draggable={false}
                  priority={i < 2}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Enhanced decorative elements */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[80vw] h-80 bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-pink-500/20 rounded-full blur-3xl z-0 animate-pulse" />
      <div className="absolute -bottom-20 left-1/4 w-[40vw] h-40 bg-gradient-to-r from-cyan-400/15 via-blue-400/25 to-purple-400/15 rounded-full blur-2xl z-0" />
      <div className="absolute -bottom-20 right-1/4 w-[40vw] h-40 bg-gradient-to-r from-purple-400/15 via-pink-400/25 to-red-400/15 rounded-full blur-2xl z-0" />
    </section>
    </div>
  );
}

function YoutubeThumbnailDeck() {
  const [deck, setDeck] = useState(youtubeDeckImages);
  const [isHovered, setIsHovered] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'animating' | 'reordering'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHovered) {
      setShufflePhase('idle');
      setIsShuffling(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    if (!isShuffling) {
      setIsShuffling(true);
      setShufflePhase('idle');
    }
    if (isShuffling && shufflePhase === 'idle') {
      timeoutRef.current = setTimeout(() => {
        setShufflePhase('animating');
      }, 1500);
    }
    if (isShuffling && shufflePhase === 'animating') {
      timeoutRef.current = setTimeout(() => {
        setShufflePhase('reordering');
      }, 700); // match animation duration
    }
    if (isShuffling && shufflePhase === 'reordering') {
      setDeck((prev) => {
        const next = [...prev];
        const top = next.shift();
        if (top) next.push(top);
        return next;
      });
      setShufflePhase('idle');
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHovered, isShuffling, shufflePhase]);

  return (
    <div
      className="relative group flex flex-col items-center justify-end"
      style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Name overlay on hover */}
      <span
        className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-black/80 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 pointer-events-none select-none shadow-lg z-30"
        style={{ whiteSpace: 'nowrap' }}
      >
        Youtube Thumbnail
      </span>
      <div className="w-full h-full flex items-center justify-center relative" style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
        {deck.map((src, idx) => {
          // By default, no tilt. On hover, animate tilt and shuffle.
          let cardClass = '';
          if (isHovered) {
            if (idx === 0 && shufflePhase === 'animating') {
              cardClass = 'z-40 scale-110 -rotate-6 translate-y-[-40px] translate-x-6 opacity-0 transition-all duration-700 ease-in-out';
            } else if (idx === 0) {
              cardClass = 'z-30 scale-110 -rotate-6 translate-y-0 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 1 && shufflePhase === 'animating') {
              cardClass = 'z-20 scale-100 rotate-0 translate-y-0 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 1) {
              cardClass = 'z-20 scale-100 rotate-0 translate-y-4 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 2 && shufflePhase === 'animating') {
              cardClass = 'z-10 scale-95 rotate-3 translate-y-4 opacity-80 transition-all duration-700 ease-in-out';
            } else if (idx === 2) {
              cardClass = 'z-10 scale-95 rotate-3 translate-y-8 opacity-80 transition-all duration-700 ease-in-out';
            } else {
              cardClass = 'opacity-0 pointer-events-none';
            }
          } else {
            // Not hovered: all cards upright, stacked, no tilt
            if (idx === 0) {
              cardClass = 'z-30 scale-100 rotate-0 translate-y-0 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 1) {
              cardClass = 'z-20 scale-95 rotate-0 translate-y-4 opacity-90 transition-all duration-700 ease-in-out';
            } else if (idx === 2) {
              cardClass = 'z-10 scale-90 rotate-0 translate-y-8 opacity-80 transition-all duration-700 ease-in-out';
            } else {
              cardClass = 'opacity-0 pointer-events-none';
            }
          }
          return (
            <Image
              key={src}
              src={src}
              alt={`Youtube Thumbnail ${idx + 1}`}
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
              className={`select-none object-contain rounded-xl border-2 border-white/10 shadow-xl bg-transparent absolute left-0 top-0 ${cardClass}`}
              style={{ pointerEvents: 'none' }}
              draggable={false}
              priority={idx === 0}
            />
          );
        })}
      </div>
    </div>
  );
}

function ByteBeanDeck() {
  const [deck, setDeck] = useState(byteBeanDeckImages);
  const [isHovered, setIsHovered] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'animating' | 'reordering'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHovered) {
      setShufflePhase('idle');
      setIsShuffling(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    if (!isShuffling) {
      setIsShuffling(true);
      setShufflePhase('idle');
    }
    if (isShuffling && shufflePhase === 'idle') {
      timeoutRef.current = setTimeout(() => {
        setShufflePhase('animating');
      }, 1500);
    }
    if (isShuffling && shufflePhase === 'animating') {
      timeoutRef.current = setTimeout(() => {
        setShufflePhase('reordering');
      }, 700); // match animation duration
    }
    if (isShuffling && shufflePhase === 'reordering') {
      setDeck((prev) => {
        const next = [...prev];
        const top = next.shift();
        if (top) next.push(top);
        return next;
      });
      setShufflePhase('idle');
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHovered, isShuffling, shufflePhase]);

  return (
    <div
      className="relative group flex flex-col items-center justify-end"
      style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Name overlay on hover */}
      <span
        className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-black/80 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 pointer-events-none select-none shadow-lg z-30"
        style={{ whiteSpace: 'nowrap' }}
      >
        ByteBean
      </span>
      <div className="w-full h-full flex items-center justify-center relative" style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
        {deck.map((src, idx) => {
          // By default, no tilt. On hover, animate tilt and shuffle.
          let cardClass = '';
          if (isHovered) {
            if (idx === 0 && shufflePhase === 'animating') {
              cardClass = 'z-40 scale-110 -rotate-6 translate-y-[-40px] translate-x-6 opacity-0 transition-all duration-700 ease-in-out';
            } else if (idx === 0) {
              cardClass = 'z-30 scale-110 -rotate-6 translate-y-0 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 1 && shufflePhase === 'animating') {
              cardClass = 'z-20 scale-100 rotate-0 translate-y-0 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 1) {
              cardClass = 'z-20 scale-100 rotate-0 translate-y-4 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 2 && shufflePhase === 'animating') {
              cardClass = 'z-10 scale-95 rotate-3 translate-y-4 opacity-80 transition-all duration-700 ease-in-out';
            } else if (idx === 2) {
              cardClass = 'z-10 scale-95 rotate-3 translate-y-8 opacity-80 transition-all duration-700 ease-in-out';
            } else {
              cardClass = 'opacity-0 pointer-events-none';
            }
          } else {
            // Not hovered: all cards upright, stacked, no tilt
            if (idx === 0) {
              cardClass = 'z-30 scale-100 rotate-0 translate-y-0 opacity-100 transition-all duration-700 ease-in-out';
            } else if (idx === 1) {
              cardClass = 'z-20 scale-95 rotate-0 translate-y-4 opacity-90 transition-all duration-700 ease-in-out';
            } else if (idx === 2) {
              cardClass = 'z-10 scale-90 rotate-0 translate-y-8 opacity-80 transition-all duration-700 ease-in-out';
            } else {
              cardClass = 'opacity-0 pointer-events-none';
            }
          }
          return (
            <Image
              key={src}
              src={src}
              alt={`ByteBean ${idx + 1}`}
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
              className={`select-none object-contain rounded-xl border-2 border-white/10 shadow-xl bg-transparent absolute left-0 top-0 ${cardClass}`}
              style={{ pointerEvents: 'none' }}
              draggable={false}
              priority={idx === 0}
            />
          );
        })}
      </div>
    </div>
  );
}