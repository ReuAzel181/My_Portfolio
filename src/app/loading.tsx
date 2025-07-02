'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        <div className="relative w-48 h-48 mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src="/Cursor - Text.png"
              alt="Cursor Logo"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </motion.div>
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/Cursor - Text.png"
              alt="Cursor Logo Glow"
              width={200}
              height={200}
              className="object-contain opacity-30 blur-sm"
              priority
            />
          </motion.div>
        </div>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto max-w-[200px]"
        />
      </motion.div>
    </div>
  )
} 