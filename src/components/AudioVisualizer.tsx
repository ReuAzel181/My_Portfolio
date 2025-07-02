'use client'

import { motion } from 'framer-motion'
import { useAudio } from '@/hooks/useAudio'

const AudioVisualizer = () => {
  const { isPlaying } = useAudio({
    src: '/Music/Gising Sa Panaginip.MP3',
    title: 'Gising Sa Panaginip',
    artist: 'Beat by TatzMaven',
    autoPlay: false,
    loop: true
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Particles */}
      {isPlaying && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#466D9D]/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, -200],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </>
      )}

      {/* Subtle Wave Effect */}
      {isPlaying && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#466D9D]/10 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      )}

      {/* Ambient Light Rings */}
      {isPlaying && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 border border-[#466D9D]/20 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-[#8B5CF6]/20 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 1,
            }}
          />
        </>
      )}

      {/* Pulse Effect */}
      {isPlaying && (
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#466D9D] rounded-full"
          style={{ transform: 'translate(-50%, -50%)' }}
          animate={{
            scale: [1, 20, 1],
            opacity: [0.8, 0, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      )}
    </div>
  );
};

export default AudioVisualizer; 