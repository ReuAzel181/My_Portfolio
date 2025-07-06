'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RiArrowLeftLine } from 'react-icons/ri'

export default function NotFound() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Check if we're offline
    setIsOffline(!window.navigator.onLine)

    // Add event listeners for online/offline status
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Force a check of the connection status
    fetch('/api/health-check').catch(() => {
      setIsOffline(true)
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Always show the game in not-found scenarios
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="mb-8">The page you are looking for does not exist.</p>
          <Link href="/" className="flex items-center gap-2 text-primary hover:underline">
            <RiArrowLeftLine /> Go back home
          </Link>
        </div>
      </div>
    </div>
  )
} 