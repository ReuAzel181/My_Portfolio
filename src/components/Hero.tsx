'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
// import AudioPlayer from './AudioPlayer'
import AudioVisualizer from './AudioVisualizer'
import { useState } from 'react'
import UIGame from './UIGame'

const Hero = () => {
  const profileImage = '/user-profile3.png'
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [showFunCard, setShowFunCard] = useState(false)
  const [showUIGame, setShowUIGame] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number}>>([])
  const [sparkleId, setSparkleId] = useState(0)

  // Direct download URL with export=download parameter
  const FILE_ID = '1yPI53anhVujRUf_mssiopLCOXrOyCX0-'
  const RESUME_URL = `https://drive.google.com/uc?export=download&id=${FILE_ID}`
  
  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDownloading(true)
    setDownloadError(null)
    
    try {
      // Attempt to force download
      const response = await fetch(RESUME_URL)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Create and trigger download link
      const a = document.createElement('a')
      a.href = url
      a.download = 'Reu_Banta_Resume.pdf' // Force download with specific filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Keep animation visible for visual feedback
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Download failed:', error)
      // If direct download fails, try alternative method
      try {
        const alternativeUrl = `https://drive.google.com/u/0/uc?id=${FILE_ID}&export=download&confirm=t`
        window.location.href = alternativeUrl
      } catch (fallbackError) {
        setDownloadError(
          'Download failed. Please try again or use the preview option.'
        )
        // Open preview as last resort
        window.open(`https://drive.google.com/file/d/${FILE_ID}/preview`, '_blank')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleProfileClick = () => {
    setShowFunCard(true)
    // Auto-hide after 3 seconds
    setTimeout(() => setShowFunCard(false), 3000)
  }

  // Create sparkles during drag
  const createSparkle = (x: number, y: number) => {
    const newSparkle = {
      id: sparkleId,
      x: x + Math.random() * 40 - 20,
      y: y + Math.random() * 40 - 20
    }
    setSparkles(prev => [...prev, newSparkle])
    setSparkleId(prev => prev + 1)
    
    // Remove sparkle after animation
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id))
    }, 1000)
  }

  // Handle drag events
  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDrag = (event: any, info: any) => {
    // Create sparkles during drag
    if (Math.random() > 0.7) { // 30% chance per frame
      createSparkle(info.point.x, info.point.y)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <section id="home" className="min-h-screen flex items-center justify-center section-padding relative overflow-hidden">
      {/* Centered download animation */}
      <AnimatePresence mode="wait">
        {(isDownloading || downloadError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ 
                duration: 0.4,
                ease: "easeOut",
                delay: 0.1
              }}
            >
              {downloadError ? (
                <>
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="w-6 h-6 text-blue-500" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </motion.div>
                  <motion.p 
                    className="text-gray-600 dark:text-gray-300 font-medium text-center max-w-sm"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {downloadError}
                  </motion.p>
                  <motion.div 
                    className="flex gap-4"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <button 
                      onClick={() => setDownloadError(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                    >
                      Close
                    </button>
                    <a 
                      href={`https://drive.google.com/file/${FILE_ID}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      onClick={() => setDownloadError(null)}
                    >
                      Open Preview
                    </a>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div 
                    className="relative w-16 h-16"
                  >
                    <motion.div 
                      className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div 
                      className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full"
                      animate={{ 
                        rotate: 360,
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                  <motion.p 
                    className="text-gray-600 dark:text-gray-300 font-medium"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    Downloading Resume...
                  </motion.p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Player */}
      {/* <AudioPlayer /> */}
      
      {/* Audio Visualizer Background */}
      <AudioVisualizer />
      
      {/* Music Indicator */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute top-1/2 left-8 transform -translate-y-1/2 z-10"
      >
       
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row justify-between items-center gap-12"
      >
        <div className="max-w-xl lg:pl-0 pr-4 md:pr-6">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 whitespace-nowrap">
            <span className="text-[#385780]/40 dark:text-[#5A7A9D]/40">Hi, I'm</span>{" "}
            <motion.span 
              className="text-[#385780] dark:text-[#5A7A9D] font-extrabold relative inline-block transform hover:scale-105 transition-transform duration-300 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-full after:h-[3px] after:bg-[#385780] dark:after:bg-[#5A7A9D] after:transform after:origin-right after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 cursor-grab active:cursor-grabbing select-none"
              drag
              dragConstraints={{ left: -500, right: 500, top: -300, bottom: 300 }}
              dragElastic={0.3}
              dragTransition={{ 
                bounceStiffness: 300, 
                bounceDamping: 30,
                power: 0.2
              }}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              animate={{ 
                scale: isDragging ? 1.1 : 1,
                rotate: isDragging ? Math.sin(Date.now() / 200) * 2 : 0
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 1,
                scale: { duration: 0.2 },
                rotate: { duration: 0.1 }
              }}
              whileHover={{ scale: 1.05 }}
              whileDrag={{ 
                scale: 1.15, 
                rotate: 5,
                zIndex: 1000,
                transition: { 
                  scale: { duration: 0.1 }, 
                  rotate: { duration: 0.1 },
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }
              }}
            >
              Reu Uzziel
            </motion.span>
          </h1>
          <h2 className="text-xl md:text-2xl text-[#385780] dark:text-[#5A7A9D] mb-6 whitespace-nowrap">
            <span className="font-bold">
              <span 
                onClick={() => setShowUIGame(true)} 
                className="cursor-pointer"
              >
                UI
              </span>
              /UX and a Web Designer
            </span>
          </h2>
          <p className="text-gray-500 mb-6 text-base max-w-lg">
            I'm passionate about crafting intuitive digital experiences that blend form and function. Drawing from my computer science background and design experiences, I strive to create solutions that make a positive impact.<span className="hidden dark:inline"> EME LANG 🤣  </span>
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="https://github.com/ReuAzel181" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="button-primary flex items-center gap-2"
            >
              View My Work
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="opacity-80"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <motion.button 
              onClick={handleDownload}
              className={`button-outline relative flex items-center gap-2 ${isDownloading ? 'pointer-events-none' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <span>Download Resume</span>
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
                initial={false}
                animate={isDownloading ? {
                  rotate: 360,
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }
                } : {}}
              >
                {isDownloading ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M15.75 4.5l-3.181 3.183a8.25 8.25 0 00-13.803 3.7" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" 
                  />
                )}
              </motion.svg>
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative w-full lg:w-[480px] h-[320px] lg:h-[480px] group"
        >
          {/* Box Frame */}
          <div className="absolute inset-0 -m-4 border-2 border-[#8B5CF6]/30 rounded-2xl transform -rotate-6 transition-transform duration-300 group-hover:rotate-0" />
          <div className="absolute inset-0 -m-2 border-2 border-[#8B5CF6]/50 rounded-xl transform rotate-3 transition-transform duration-300 group-hover:rotate-0" />
          
          {/* Main Image Container */}
          <div className="relative h-full rounded-lg">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/10 mix-blend-overlay rounded-lg" />
            {/* Image Wrapper for positioning */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[110%] cursor-pointer z-10">
              <Image
                src={profileImage}
                alt="Reu Uzziel"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                priority
                onClick={handleProfileClick}
              />
              {/* Fun Card Overlay */}
              <AnimatePresence>
                {showFunCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-[15%] z-20"
                  >
                    <div className="bg-white dark:bg-gray-900 border border-purple-400 px-3 py-1.5 rounded-lg shadow-lg text-purple-700 dark:text-purple-300 font-bold text-sm flex items-center gap-2 animate-bounce">
                      PURE BREED ANNUNNAKI! <span className="text-lg">😂</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Pass-through Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8B5CF6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
          </div>
        </motion.div>
      </motion.div>

      {/* Sparkle Effects */}
      <AnimatePresence>
        {sparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 1, scale: 0, rotate: 0 }}
            animate={{ 
              opacity: [1, 1, 0], 
              scale: [0, 1, 0.5], 
              rotate: [0, 180, 360],
              y: [0, -20, -40]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute pointer-events-none z-50"
            style={{
              left: sparkle.x,
              top: sparkle.y,
            }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full shadow-lg">
              <div className="w-full h-full bg-white/50 rounded-full animate-pulse" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* UI Game */}
      <UIGame isVisible={showUIGame} onClose={() => setShowUIGame(false)} />
    </section>
  )
}

export default Hero