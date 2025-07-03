'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  PaintBrushIcon,
  CodeBracketIcon,
  LightBulbIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

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
    <section id="services" className="section-padding bg-gradient-to-b from-black to-gray-900 relative overflow-hidden z-0">
      {/* Decorative accent */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-tr from-secondary/30 to-transparent rounded-full blur-3xl z-0" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6 heading-gradient">What I Offer</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            I enjoy combining design and technical skills to create solutions that work well and look good. Here's how I can help with your project:
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 hover:border-secondary shadow-lg hover:shadow-secondary/20 transition-all duration-300 group"
              >
                <div className="mb-6 flex items-center justify-center">
                  <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Icon className="h-10 w-10 text-secondary" />
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{service.title}</h3>
                <p className="text-gray-400 text-base">{service.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Personal touch section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-20 max-w-3xl mx-auto text-center bg-gray-900/70 rounded-xl p-8 border border-gray-800 shadow-lg"
        >
          <h4 className="text-2xl font-bold mb-4 heading-gradient">Why work with me?</h4>
          <p className="text-gray-300 text-lg">
            I approach each project with care and attention to detail. I believe in clear communication and working together to achieve the best results. Let's work on something great together!
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default Services 