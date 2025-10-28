'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Projects from '@/components/Projects'
import Services from '@/components/Services'
import Skills from '@/components/Skills'
import Contact from '@/components/Contact'
import AIAssistant from '@/components/AIAssistant'
import HorizontalScroller from '@/components/HorizontalScroller'
import SectionTransition from '@/components/SectionTransition'


export default function Home() {
  // Temporarily disabled mobile redirect for testing responsiveness
  // const [isMobile, setIsMobile] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const checkMobile = () => {
  //     const userAgent = navigator.userAgent.toLowerCase();
  //     const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  //     const isSmallScreen = window.innerWidth <= 768;
      
  //     setIsMobile(isMobileDevice || isSmallScreen);
  //     setIsLoading(false);
  //   };

  //   checkMobile();
  //   window.addEventListener('resize', checkMobile);
    
  //   return () => window.removeEventListener('resize', checkMobile);
  // }, []);

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
  //     </div>
  //   );
  // }

  // if (isMobile) {
  //   return <MobileTest />;
  // }

  return (
    <div className="min-h-screen pt-16">
      <Navigation />
      <SectionTransition>
        <Hero />
      </SectionTransition>
      <SectionTransition delay={0.05}>
        <HorizontalScroller />
      </SectionTransition>
      <SectionTransition delay={0.1}>
        <Skills />
      </SectionTransition>
      <SectionTransition delay={0.15}>
        <Projects />
      </SectionTransition>
      <SectionTransition delay={0.25}>
        <Services />
      </SectionTransition>
      <SectionTransition delay={0.3}>
        <Contact />
      </SectionTransition>
      <AIAssistant />
    </div>
  )
}