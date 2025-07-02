import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';

const images = [
  '/ui-projects/Asenso.png',
  '/ui-projects/ByteBean/ByteBean.png',
  '/ui-projects/Fidget.png',
  '/ui-projects/Poster.png',
  '/ui-projects/SL.png',
  '/ui-projects/Youtube Thumbnail.png',
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
    <section
      ref={containerRef}
      className="relative w-full min-h-[400px] py-16 flex flex-col items-center justify-center overflow-visible pb-24"
      style={{
        background: 'linear-gradient(120deg, #18181b 60%, #232946 100%)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        zIndex: 1,
        overflow: 'hidden',
        maxWidth: '100vw',
      }}
    >
      {/* Section Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none select-none">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">UI Projects Showcase</h2>
        <p className="text-base text-white/70 mt-2">A dynamic, immersive gallery</p>
      </div>
      {/* Single Row */}
      <div
        ref={rowRef}
        className="flex gap-8 absolute left-0 top-1/2 -translate-y-1/2 z-20"
        style={{ pointerEvents: 'auto', width: TOTAL_WIDTH, maxWidth: '100vw', top: '180px' }}
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
              {/* Name overlay on hover */}
              <span
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-black/80 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 pointer-events-none select-none shadow-lg z-30"
                style={{ whiteSpace: 'nowrap' }}
              >
                {name}
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
                  className="select-none object-contain rounded-xl border-2 border-white/10 shadow-xl bg-transparent transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                  draggable={false}
                  priority={i < 2}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Decorative blurred gradient */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-64 bg-gradient-to-r from-blue-400/30 via-purple-400/20 to-pink-400/30 rounded-full blur-3xl z-0" />
    </section>
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