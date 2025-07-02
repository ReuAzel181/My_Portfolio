'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isOverLink, setIsOverLink] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const positionRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)

  useEffect(() => {
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

    // Set loading state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

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

    const moveCursor = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      positionRef.current = { x: x - 15, y: y - 15 };
      scaleRef.current = calculateEdgeScale(x, y);
      setPosition({ x: x - 15, y: y - 15 });
      setScale(scaleRef.current);
      setIsVisible(!isLoading);
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    const handleLinkHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isLink = target.tagName.toLowerCase() === 'a' ||
                    target.tagName.toLowerCase() === 'button' ||
                    target.closest('a') !== null ||
                    target.closest('button') !== null ||
                    target.getAttribute('role') === 'button' ||
                    target.classList.contains('cursor-pointer')
      
      setIsOverLink(!!isLink)
    }

    window.addEventListener('mousemove', moveCursor, { passive: true })
    window.addEventListener('mousemove', handleLinkHover, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    
    // Hide cursor when leaving the window
    window.addEventListener('mouseout', () => setIsVisible(false))
    window.addEventListener('mouseleave', () => setIsVisible(false))

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mousemove', handleLinkHover)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseout', () => setIsVisible(false))
      window.removeEventListener('mouseleave', () => setIsVisible(false))
    }
  }, [isLoading])

  if (isLoading) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] custom-cursor-overlay"
      animate={{
        x: position.x,
        y: position.y,
        scale: isClicking ? scale * 0.8 : isOverLink ? scale * 1.2 : scale,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        x: { type: 'spring', stiffness: 1000, damping: 50 },
        y: { type: 'spring', stiffness: 1000, damping: 50 },
        scale: { type: 'spring', stiffness: 200, damping: 20 },
        opacity: { duration: 0.15 }
      }}
      style={{ transform: 'translateZ(0)' }}
    >
      <div className="relative w-[30px] h-[30px] -rotate-[15deg]">
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
  )
} 