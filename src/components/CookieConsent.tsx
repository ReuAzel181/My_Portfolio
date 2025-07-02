'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCookie, setCookie } from '@/utils/cookies'

const CookieEmoji = () => (
  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-300 rounded-xl shadow-md relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_60%)]" />
    <span className="text-2xl transform -translate-y-[1px]" role="img" aria-label="Cookie">🍪</span>
  </div>
)

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const hasConsented = getCookie('cookie-consent')
    if (!hasConsented) {
      const timer = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    setCookie('cookie-consent', 'true')
    setShowBanner(false)
  }

  const handleAcceptAll = () => {
    setCookie('cookie-consent', 'all')
    setShowBanner(false)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-gradient-to-b from-gray-900/95 to-gray-900/90 backdrop-blur-md shadow-2xl border-t border-gray-800">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-start gap-4">
                <CookieEmoji />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Cookie Settings</h3>
                      <p className="text-base text-gray-300 mt-1">
                        This site uses cookies to improve your experience.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAccept}
                        className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
                      >
                        Essential
                      </button>
                      <button
                        onClick={handleAcceptAll}
                        className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30"
                      >
                        Accept All
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="mt-3 text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1.5 group w-full sm:w-auto p-2 -m-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="border-b border-dotted border-gray-700 group-hover:border-gray-500">
                        {showDetails ? 'Hide details' : 'View details'}
                      </span>
                      <svg 
                        className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 grid sm:grid-cols-2 gap-3">
                          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-lg border border-gray-700/50 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.1),transparent_70%)]" />
                            <div className="w-6 h-6 mt-0.5 rounded-lg bg-green-900/50 flex items-center justify-center flex-shrink-0 ring-1 ring-green-500/30">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            </div>
                            <div className="relative">
                              <h4 className="text-sm font-medium text-white">Essential Cookies</h4>
                              <p className="text-sm text-gray-400 mt-1">
                                Required for basic site functionality.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-lg border border-gray-700/50 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_70%)]" />
                            <div className="w-6 h-6 mt-0.5 rounded-lg bg-blue-900/50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-500/30">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            </div>
                            <div className="relative">
                              <h4 className="text-sm font-medium text-white">Analytics Cookies</h4>
                              <p className="text-sm text-gray-400 mt-1">
                                Helps improve site performance through usage data.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 