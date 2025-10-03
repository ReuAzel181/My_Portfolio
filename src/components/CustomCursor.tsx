'use client'

import { useEffect, useState, useRef, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'

// Create a context for loading state
export const LoadingContext = createContext<{
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}>({
  isLoading: true,
  setIsLoading: () => {},
})

export function useLoading() {
  return useContext(LoadingContext)
}

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isOverLink, setIsOverLink] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [idleState, setIdleState] = useState<number>(1)

  const { isLoading } = useLoading()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const positionRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const lastValidPosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isLoading) {
      // Move cursor to current mouse position after loading
      const event = new MouseEvent('mousemove', {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
      })
      window.dispatchEvent(event)
    }
  }, [isLoading])

  useEffect(() => {
    setIsMounted(true)
    // Check initial theme
    setIsDarkTheme(document.documentElement.classList.contains('dark-theme'))

    // Create observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkTheme(document.documentElement.classList.contains('dark-theme'))
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    const calculateEdgeScale = (x: number, y: number) => {
      const edgeThreshold = 100;
      const minScale = 0.8;
      
      const distanceFromLeft = x;
      const distanceFromRight = window.innerWidth - x;
      const distanceFromTop = y;
      const distanceFromBottom = window.innerHeight - y;
      
      const minDistance = Math.min(
        distanceFromLeft,
        distanceFromRight,
        distanceFromTop,
        distanceFromBottom
      );
      
      if (minDistance > edgeThreshold) return 1;
      
      const scale = minScale + (1 - minScale) * (minDistance / edgeThreshold);
      return Math.max(minScale, scale);
    };

    const isInViewport = (x: number, y: number) => {
      return x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight;
    };

    let idleTimer: number | null = null
    const resetIdleTimer = () => {
      if (idleTimer) {
        window.clearTimeout(idleTimer)
      }
      setIsIdle(false)
      idleTimer = window.setTimeout(() => {
        setIsIdle(true)
        setIdleState(Math.floor(Math.random() * 5) + 1)
      }, 5000)
    }

    const moveCursor = (e: MouseEvent) => {
      if (!isMounted || isLoading) return;
      
      // Check if cursor is disabled during drag operations
      const cursorDisabled = document.documentElement.style.getPropertyValue('--cursor-disabled') === 'true'
      if (cursorDisabled) {
        setIsVisible(false)
        return
      }

      const x = e.clientX;
      const y = e.clientY;

      // Update position regardless of viewport bounds
      const newPosition = { x: x - 15, y: y - 15 };
      positionRef.current = newPosition;
      setPosition(newPosition);
      resetIdleTimer()

      // Only update visibility and scale based on viewport bounds
      if (!isInViewport(x, y)) {
        setIsVisible(false);
      } else {
        lastValidPosition.current = newPosition;
        scaleRef.current = calculateEdgeScale(x, y);
        setScale(scaleRef.current);
        setIsVisible(true);
      }
    }

    const handleMouseDown = () => {
      if (isLoading) return;
      
      // Check if cursor is disabled during drag operations
      const cursorDisabled = document.documentElement.style.getPropertyValue('--cursor-disabled') === 'true'
      if (cursorDisabled) return
      
      setIsClicking(true)
      resetIdleTimer()
    }

    const handleMouseUp = () => {
      if (isLoading) return;
      
      // Check if cursor is disabled during drag operations
      const cursorDisabled = document.documentElement.style.getPropertyValue('--cursor-disabled') === 'true'
      if (cursorDisabled) return
      
      setIsClicking(false)
      resetIdleTimer()
    }

    const handleLinkHover = (e: MouseEvent) => {
      if (isLoading) return;
      
      // Check if cursor is disabled during drag operations
      const cursorDisabled = document.documentElement.style.getPropertyValue('--cursor-disabled') === 'true'
      if (cursorDisabled) return
      
      try {
        const target = e.target;
        
        if (!target || !(target instanceof Element)) {
          setIsOverLink(false);
          return;
        }

        const tagName = target.tagName.toLowerCase();
        const isDirectLink = tagName === 'a' || tagName === 'button';
        const hasLinkParent = target.closest('a, button') !== null;
        const isButtonRole = target.getAttribute('role') === 'button';
        const isPointer = target.classList.contains('cursor-pointer');
        
        setIsOverLink(isDirectLink || hasLinkParent || isButtonRole || isPointer);
        resetIdleTimer()
      } catch (error) {
        console.error('Error in handleLinkHover:', error);
        setIsOverLink(false);
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsOverLink(false);
      setIsClicking(false);
    };

    // Handle when mouse leaves any part of the document
    const handleMouseOut = (e: MouseEvent) => {
      const from = e.relatedTarget as HTMLElement | null;
      if (!from || from.nodeName === 'HTML') {
        handleMouseLeave();
      }
    };

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mousemove', handleLinkHover)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseout', handleMouseOut)
    resetIdleTimer()

    return () => {
      observer.disconnect()
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mousemove', handleLinkHover)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseout', handleMouseOut)
      if (idleTimer) window.clearTimeout(idleTimer)
      setIsMounted(false)
    }
  }, [isMounted, isLoading])

  // Don't render anything during SSR
  if (typeof window === 'undefined') return null;

  // Don't render while loading
  if (isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] custom-cursor-overlay"
        animate={{
          x: position.x,
          y: position.y,
          scale: isClicking ? scale * 0.8 : isOverLink ? scale * 1.2 : scale,
          opacity: isVisible ? 1 : 0,
        }}
        initial={false}
        transition={{
          x: { type: 'spring', stiffness: 1000, damping: 50 },
          y: { type: 'spring', stiffness: 1000, damping: 50 },
          scale: { type: 'spring', stiffness: 200, damping: 20 },
          opacity: { duration: 0.15 }
        }}
        style={{ transform: 'translateZ(0)' }}
      >
        <div className={`relative w-[30px] h-[30px] -rotate-[15deg] ${isIdle ? 'cursor-idle-active cursor-idle-' + idleState : ''}`}>
          {/* Primary cursor for light theme */}
          <Image
            src="/Cursor - Primary.png"
            alt="Cursor"
            width={30}
            height={30}
            style={{ width: 30, height: 'auto' }}
            priority
            className={`
              absolute top-0 left-0
              transition-all duration-150
              ${!isDarkTheme ? 'opacity-100' : 'opacity-0'}
              ${isOverLink ? 'rotate-[10deg]' : ''}
              ${isClicking ? '-rotate-[10deg]' : ''}
            `}
          />
          {/* Accent cursor for dark theme */}
          <Image
            src="/Cursor - Accent.png"
            alt="Cursor"
            width={30}
            height={30}
            style={{ width: 30, height: 'auto' }}
            priority
            className={`
              absolute top-0 left-0
              transition-all duration-150
              ${isDarkTheme ? 'opacity-100' : 'opacity-0'}
              ${isOverLink ? 'rotate-[10deg]' : ''}
              ${isClicking ? '-rotate-[10deg]' : ''}
            `}
          />
        </div>
        {isOverLink && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-current rounded-full blur-md -rotate-[15deg]"
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}