'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
// import AudioPlayer from './AudioPlayer'
import AudioVisualizer from './AudioVisualizer'
import { useState } from 'react'

const Hero = () => {
  const profileImage = '/user-profile.png'
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [showFunCard, setShowFunCard] = useState(false)

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

  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
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
        className="max-w-6xl mx-auto w-full px-4 md:px-6 lg:px-8 flex flex-col lg:flex-row justify-between items-center gap-12"
      >
        <div className="max-w-xl lg:pl-0 pr-4 md:pr-6">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 whitespace-nowrap">
            <span className="text-[#385780]/40 dark:text-[#5A7A9D]/40">Hi, I'm</span>{" "}
            <span className="text-[#385780] dark:text-[#5A7A9D] font-extrabold relative inline-block transform hover:scale-105 transition-transform duration-300 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-full after:h-[3px] after:bg-[#385780] dark:after:bg-[#5A7A9D] after:transform after:origin-right after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">
              Reu Uzziel
            </span>
          </h1>
          <h2 className="text-xl md:text-2xl text-[#385780] dark:text-[#5A7A9D] mb-6 whitespace-nowrap">
            <span className="font-bold">UI/UX Designer</span> with a Computer Science Degree
          </h2>
          <p className="text-gray-500 mb-6 text-base max-w-lg">
            I'm passionate about crafting intuitive digital experiences that blend form and function. Drawing from my computer science background and design expertise, I strive to create solutions that make a positive impact.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="https://github.com/ReuAzel181" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="button-primary"
            >
              View My Work
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
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[95%] h-[120%] cursor-pointer z-10">
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
    </section>
  )
}

export default Hero 