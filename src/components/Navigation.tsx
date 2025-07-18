'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import RippleButton from './RippleButton'
import Music from './Music'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [showMusic, setShowMusic] = useState(false)
  const [indicatorWidth, setIndicatorWidth] = useState(0)
  const [indicatorOffset, setIndicatorOffset] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const navRef = useRef<HTMLDivElement>(null)

  const menuItems = [
    { name: 'Home', href: '#home' },
    { name: 'Digital Playground', href: '#digital-playground' },
    { name: 'Projects', href: '#projects' },
    { name: 'Services', href: '#services' },
    { name: 'Contact', href: '#contact' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.map(item => item.href.substring(1))
      
      // Calculate scroll progress
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const progress = (scrolled / windowHeight) * 100
      setScrollProgress(progress)
      
      // Check if we're at the bottom of the page
      const isAtBottom = Math.ceil(window.innerHeight + window.pageYOffset) >= document.documentElement.scrollHeight - 2

      // If at bottom, always highlight Contact section
      if (isAtBottom) {
        setActiveSection('contact')
        updateIndicator('contact')
        return
      }

      // Find the current section in view
      let currentSection = ''
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          const isVisible = rect.top <= 100 && rect.bottom >= 0
          if (isVisible) {
            currentSection = section
          }
        }
      }

      // If no section is found but we're close to bottom, default to contact
      if (!currentSection && window.innerHeight + window.pageYOffset > document.documentElement.scrollHeight - window.innerHeight) {
        currentSection = 'contact'
      }

      setActiveSection(currentSection)
      updateIndicator(currentSection)
    }

    // Add scroll event listener with throttling
    let ticking = false
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', scrollListener)
    // Initial check
    handleScroll()
    
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  const updateIndicator = (currentSection: string) => {
    if (!navRef.current) return

    const activeLink = navRef.current.querySelector(`a[href="#${currentSection}"]`)
    if (activeLink) {
      const linkRect = activeLink.getBoundingClientRect()
      const navRect = navRef.current.getBoundingClientRect()
      setIndicatorWidth(linkRect.width)
      setIndicatorOffset(linkRect.left - navRect.left)
    }
  }

  // Reset click counter when page refreshes
  useEffect(() => {
    setClickCount(0)
    setShowMusic(false)
  }, [])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const currentTime = Date.now()
    const timeDiff = currentTime - lastClickTime
    
    if (timeDiff < 500) {
      const newCount = clickCount + 1
      setClickCount(newCount)
      
      if (newCount >= 5) {
        setShowMusic(true)
        setClickCount(0)
      }
    } else {
      setClickCount(1)
    }
    
    setLastClickTime(currentTime)
  }

  const handleClick = (href: string) => {
    const element = document.getElementById(href.substring(1))
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      setTimeout(() => {
        setActiveSection(href.substring(1))
        updateIndicator(href.substring(1))
      }, 100)
    }
    setIsOpen(false)
  }

  return (
    <>
      <nav className="fixed w-full z-50" style={{ backgroundColor: 'var(--nav-bg)', backdropFilter: 'blur(8px)' }}>
        {/* Scroll Progress Bar - Moved to top */}
        <motion.div
          className="absolute top-0 left-0 h-1 bg-[#385780] dark:bg-[#5A7A9D]"
          style={{
            width: `${scrollProgress}%`,
          }}
          transition={{
            duration: 0.1,
            ease: "easeInOut"
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0"
            >
              <div onClick={handleLogoClick} className="cursor-pointer">
                <Image
                  src="/primary-logo.png"
                  alt="Reu Uzziel Logo"
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: 'auto', height: '40px' }}
                  className="transition-transform hover:scale-110"
                />
              </div>
            </motion.div>

            {/* Desktop menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <div ref={navRef} className="flex items-baseline space-x-4 relative">
                <motion.div
                  className="absolute bottom-0 h-0.5 bg-[#385780] dark:bg-[#5A7A9D] rounded-full"
                  animate={{
                    width: indicatorWidth,
                    x: indicatorOffset,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30
                  }}
                />
                {menuItems.map((item) => (
                  <RippleButton
                    key={item.name}
                    className={`rounded-md ${
                      activeSection === item.href.substring(1)
                        ? 'text-[#385780] dark:text-[#5A7A9D]'
                        : 'text-gray-700 dark:text-gray-300 hover:text-[#385780] dark:hover:text-[#5A7A9D]'
                    }`}
                  >
                    <Link
                      href={item.href}
                      onClick={() => handleClick(item.href)}
                      className="px-3 py-2 block text-sm font-medium transition-all duration-200"
                    >
                      {item.name}
                    </Link>
                  </RippleButton>
                ))}
              </div>
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center space-x-4 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-700 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <div className="relative w-6 h-6">
                  <span
                    className={`absolute w-full h-0.5 bg-current transform transition duration-300 ease-in-out ${
                      isOpen ? 'rotate-45 translate-y-2.5' : 'translate-y-1'
                    }`}
                  />
                  <span
                    className={`absolute w-full h-0.5 bg-current transform transition duration-300 ease-in-out ${
                      isOpen ? 'opacity-0' : 'translate-y-3'
                    }`}
                  />
                  <span
                    className={`absolute w-full h-0.5 bg-current transform transition duration-300 ease-in-out ${
                      isOpen ? '-rotate-45 translate-y-2.5' : 'translate-y-5'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0 }}
          className="md:hidden overflow-hidden border-t border-gray-700"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <RippleButton
                key={item.name}
                className={`w-full rounded-md ${
                  activeSection === item.href.substring(1)
                    ? 'text-[#385780] dark:text-[#5A7A9D] bg-[#385780]/10 dark:bg-[#5A7A9D]/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-[#385780] dark:hover:text-[#5A7A9D] hover:bg-[#385780]/5 dark:hover:bg-[#5A7A9D]/10'
                }`}
              >
                <Link
                  href={item.href}
                  onClick={() => handleClick(item.href)}
                  className="block px-3 py-2 text-base font-medium"
                >
                  {item.name}
                </Link>
              </RippleButton>
            ))}
          </div>
        </motion.div>
      </nav>
      {showMusic && <Music />}
    </>
  )
}

export default Navigation 