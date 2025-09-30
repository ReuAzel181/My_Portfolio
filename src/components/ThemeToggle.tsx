'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { theme, setTheme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    setIsAnimating(true)
    setTheme(theme === 'light' ? 'dark' : 'light')
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 800)
  }

  const isDark = theme === 'dark'

  return (
    <div className="relative">
      <motion.button
        whileHover={{ 
          scale: 1.08,
          rotate: isDark ? -5 : 5,
          boxShadow: isDark 
            ? '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 8px 32px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          transition: { duration: 0.2, type: "spring", stiffness: 400 }
        }}
        whileTap={{ 
          scale: 0.92,
          rotate: isDark ? 2 : -2,
          transition: { duration: 0.1, type: "spring", stiffness: 400 }
        }}
        animate={{
          background: isDark ? '#1e293b' : '#6b7280',
          borderRadius: isAnimating ? "20px" : "50%",
          boxShadow: isDark 
            ? '0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 4px 20px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
        transition={{ 
          background: { duration: 0.6, ease: "easeInOut" },
          borderRadius: { duration: 0.4, ease: "easeInOut" },
          boxShadow: { duration: 0.5, ease: "easeInOut" },
          default: { type: "spring", stiffness: 300, damping: 20 }
        }}
        onClick={toggleTheme}
        className="relative p-3 overflow-hidden group"
        aria-label="Toggle theme"
      >
        {/* Enhanced animated background glow with solid colors */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundColor: isDark
              ? 'rgba(59, 130, 246, 0.15)'
              : 'rgba(255, 255, 255, 0.15)',
            borderRadius: isAnimating ? "20px" : "50%",
            scale: isAnimating ? 1.1 : 1,
            rotate: isAnimating ? (isDark ? 180 : -180) : 0,
          }}
          transition={{ 
            duration: 0.6, 
            ease: "easeInOut",
            scale: { type: "spring", stiffness: 200, damping: 15 }
          }}
        />

        {/* Enhanced ripple effect with morphing */}
        <AnimatePresence>
          {isAnimating && (
            <>
              {/* Primary ripple */}
              <motion.div
                className="absolute inset-0"
                initial={{ 
                  scale: 0, 
                  opacity: 0.8,
                  borderRadius: "50%",
                  rotate: 0
                }}
                animate={{ 
                  scale: 2.5, 
                  opacity: 0,
                  borderRadius: "20px",
                  rotate: isDark ? 360 : -360
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeOut",
                  scale: { type: "spring", stiffness: 100, damping: 15 }
                }}
                style={{
                  backgroundColor: isDark 
                    ? 'rgba(59, 130, 246, 0.4)'
                    : 'rgba(255, 255, 255, 0.4)'
                }}
              />
              {/* Secondary ripple for depth */}
              <motion.div
                className="absolute inset-0"
                initial={{ 
                  scale: 0, 
                  opacity: 0.4,
                  borderRadius: "50%"
                }}
                animate={{ 
                  scale: 1.8, 
                  opacity: 0,
                  borderRadius: "30px"
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.1,
                  ease: "easeOut"
                }}
                style={{
                  backgroundColor: isDark 
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.2)'
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Enhanced icon container with morphing transitions */}
        <motion.div 
          className="relative z-10 flex items-center justify-center"
          animate={{
            scale: isAnimating ? 1.2 : 1,
            rotate: isAnimating ? (isDark ? -15 : 15) : 0,
          }}
          transition={{ 
            duration: 0.4, 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ 
                  rotate: -180, 
                  scale: 0, 
                  opacity: 0,
                  y: 20
                }}
                animate={{ 
                  rotate: 0, 
                  scale: 1, 
                  opacity: 1,
                  y: 0
                }}
                exit={{ 
                  rotate: 180, 
                  scale: 0, 
                  opacity: 0,
                  y: -20
                }}
                transition={{ 
                  duration: 0.5, 
                  ease: "easeInOut",
                  type: "spring",
                  stiffness: 250,
                  damping: 18
                }}
                className="text-blue-200"
              >
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  animate={{ 
                    scale: isAnimating ? [1, 1.3, 1] : 1,
                    rotate: isAnimating ? [0, -10, 0] : 0
                  }}
                  transition={{ 
                    duration: 0.6, 
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                  }}
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </motion.svg>
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ 
                  rotate: 180, 
                  scale: 0, 
                  opacity: 0,
                  y: -20
                }}
                animate={{ 
                  rotate: 0, 
                  scale: 1, 
                  opacity: 1,
                  y: 0
                }}
                exit={{ 
                  rotate: -180, 
                  scale: 0, 
                  opacity: 0,
                  y: 20
                }}
                transition={{ 
                  duration: 0.5, 
                  ease: "easeInOut",
                  type: "spring",
                  stiffness: 250,
                  damping: 18
                }}
                className="text-white"
              >
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  animate={{ 
                    rotate: isAnimating ? [0, 360, 720] : 0,
                    scale: isAnimating ? [1, 1.4, 1] : 1
                  }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                  }}
                >
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </motion.svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced border animation with morphing */}
        <motion.div
          className="absolute inset-0 border-2"
          animate={{
            borderColor: isDark 
              ? 'rgba(59, 130, 246, 0.4)' 
              : 'rgba(255, 255, 255, 0.4)',
            borderRadius: isAnimating ? "20px" : "50%",
            borderWidth: isAnimating ? "3px" : "2px",
            scale: isAnimating ? 1.05 : 1,
          }}
          transition={{ 
            duration: 0.6, 
            ease: "easeInOut",
            scale: { type: "spring", stiffness: 200, damping: 15 }
          }}
        />
        
        {/* Additional animated border for depth */}
        <motion.div
          className="absolute inset-0 border"
          animate={{
            borderColor: isDark 
              ? 'rgba(147, 51, 234, 0.2)' 
              : 'rgba(107, 114, 128, 0.2)',
            borderRadius: isAnimating ? "25px" : "50%",
            scale: isAnimating ? 1.1 : 1.02,
            opacity: isAnimating ? 0.8 : 0.3,
          }}
          transition={{ 
            duration: 0.7, 
            ease: "easeInOut",
            scale: { type: "spring", stiffness: 150, damping: 20 }
          }}
        />
      </motion.button>
    </div>
  )
}

export default ThemeToggle