'use client'

import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Projects from '@/components/Projects'
import Services from '@/components/Services'
import Skills from '@/components/Skills'
import Timeline from '@/components/Timeline'
import Contact from '@/components/Contact'
import BuyMeACoffee from '@/components/BuyMeACoffee'
import HorizontalScroller from '@/components/HorizontalScroller'
import SectionTransition from '@/components/SectionTransition'

export default function Home() {
  return (
    <div className="min-h-screen">
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
      <SectionTransition delay={0.2}>
        <Timeline />
      </SectionTransition>
      <SectionTransition delay={0.25}>
        <Services />
      </SectionTransition>
      <SectionTransition delay={0.3}>
        <Contact />
      </SectionTransition>
      <SectionTransition delay={0.35}>
        <BuyMeACoffee />
      </SectionTransition>
    </div>
  )
} 