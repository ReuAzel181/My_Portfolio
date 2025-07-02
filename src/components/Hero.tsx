'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
// import AudioPlayer from './AudioPlayer'
import AudioVisualizer from './AudioVisualizer'

const Hero = () => {
  const profileImage = '/user-profile.png'

  return (
    <section className="section-padding min-h-screen flex items-center relative">
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
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl md:text-7xl font-bold mb-6 text-soft-black">
            Hi, I'm <span className="text-[#466D9D] relative inline-block transform hover:scale-105 transition-transform duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#466D9D] after:transform after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">Reu Uzziel</span>
          </h1>
          <h2 className="text-2xl md:text-3xl text-gray-600 mb-8">
            UI/UX Designer & Developer with a Computer Science Degree
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            I create beautiful, functional, and user-centered digital experiences.
            With a strong foundation in computer science and a passion for design,
            I bridge the gap between aesthetics and functionality.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#projects" className="button-primary">
              View My Work
            </a>
            <a href="#contact" className="button-outline">
              Get in Touch
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative h-[400px] lg:h-[600px] group"
        >
          {/* Box Frame */}
          <div className="absolute inset-0 -m-6 border-2 border-[#8B5CF6]/30 rounded-3xl transform -rotate-6 transition-transform duration-300 group-hover:rotate-0" />
          <div className="absolute inset-0 -m-3 border-2 border-[#8B5CF6]/50 rounded-2xl transform rotate-3 transition-transform duration-300 group-hover:rotate-0" />
          
          {/* Main Image Container */}
          <div className="relative h-full rounded-xl">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/10 mix-blend-overlay rounded-xl" />
            
            {/* Image Wrapper for positioning */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[120%]">
                <Image
                  src={profileImage}
                  alt="Reu Uzziel"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                  priority
                />
            </div>
            
            {/* Pass-through Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8B5CF6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero 