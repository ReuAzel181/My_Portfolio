'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  PaintBrushIcon,
  CodeBracketIcon,
  LightBulbIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { TITLE_SIZES, COLORS, TYPOGRAPHY } from '@/lib/designTokens'

const services = [
  {
    title: 'Brand Identity',
    description:
      "I help create visual identities that reflect your brand's values and connect with your audience.",
    icon: PaintBrushIcon,
  },
  {
    title: 'Website Design',
    description:
      "I work on responsive websites that are both visually appealing and easy to use.",
    icon: CodeBracketIcon,
  },
  {
    title: 'Creative Direction',
    description:
      "I offer guidance to help make your message clear and visually engaging.",
    icon: LightBulbIcon,
  },
  {
    title: 'UI/UX Consulting',
    description:
      "I assist in improving your product's user experience through thoughtful design and collaboration.",
    icon: UserGroupIcon,
  },
]

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="services" className="section-padding bg-gradient-to-b from-black to-gray-900 relative overflow-hidden z-0" style={{ paddingLeft: 'var(--section-padding-x)', paddingRight: 'var(--section-padding-x)' }}>
      {/* Decorative accent */}
      <div className="absolute -top-12 -right-12 sm:-top-24 sm:-right-24 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-tr from-secondary/30 to-transparent rounded-full blur-3xl z-0" />
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 
            className="font-bold mb-4 sm:mb-6 text-white"
            style={{ fontSize: 'var(--font-size-section)' }}
          >
            What I Offer
          </h2>
          <p 
            className="max-w-xl mx-auto text-white px-4 sm:px-0"
            style={{ fontSize: 'var(--font-size-card)' }}
          >
            I enjoy combining design and technical skills to create solutions that work well and look good. Here's how I can help with your project:
          </p>
        </motion.div>

        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
        >
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3, type: "spring", stiffness: 300 }
                }}
                className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-gray-800 hover:border-secondary shadow-lg hover:shadow-secondary/20 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                style={{
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div className="mb-3 sm:mb-4 flex items-center justify-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
                  </span>
                </div>
                <h3 
                  className="font-semibold mb-2 text-white"
                  style={{ fontSize: 'var(--font-size-card)' }}
                >
                  {service.title}
                </h3>
                <p 
                  className="leading-relaxed text-white"
                  style={{ fontSize: 'var(--font-size-card)' }}
                >
                  {service.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Personal touch section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.3, type: "spring", stiffness: 300 }
          }}
          className="mt-8 sm:mt-12 lg:mt-16 max-w-2xl mx-auto text-center bg-gray-900/70 rounded-xl p-6 sm:p-8 border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)'
          }}
        >
          <h4 
            className="font-bold mb-3 sm:mb-4 heading-gradient"
            style={{ fontSize: 'var(--font-size-card)' }}
          >
            Why work with me?
          </h4>
          <p 
            className="leading-relaxed text-white"
            style={{ fontSize: 'var(--font-size-card)' }}
          >
            I approach each project with care and attention to detail. I believe in clear communication and working together to achieve the best results. Let's work on something great together!
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default Services