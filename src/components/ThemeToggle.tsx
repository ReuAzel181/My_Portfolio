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
    setTimeout(() => setIsAnimating(false), 600)
  }

  const isDark = theme === 'dark'

  return (
    <div className="relative">
      <motion.button
        whileHover={{ 
          scale: 1.05,
          boxShadow: isDark 
            ? "0 0 20px rgba(90, 122, 157, 0.4)" 
            : "0 0 20px rgba(56, 87, 128, 0.4)"
        }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="relative p-3 rounded-full overflow-hidden group"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
            : 'linear-gradient(135deg, #385780 0%, #4a6fa5 100%)',
        }}
        aria-label="Toggle theme"
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            background: isDark
              ? 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Ripple effect on click */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background: isDark 
                  ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Icon container with smooth transitions */}
        <div className="relative z-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut",
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="text-blue-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut",
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="text-yellow-100"
              >
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  animate={{ rotate: isAnimating ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </motion.svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle border animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          animate={{
            borderColor: isDark 
              ? 'rgba(59, 130, 246, 0.3)' 
              : 'rgba(251, 191, 36, 0.3)',
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.button>
    </div>
  )
}

export default ThemeToggle