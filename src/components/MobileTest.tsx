'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

const MobileTest = () => {
  const [activeSection, setActiveSection] = useState('home')

  const sections = [
    { id: 'home', title: 'Home', icon: '🏠' },
    { id: 'about', title: 'About', icon: '👨‍💻' },
    { id: 'projects', title: 'Projects', icon: '💼' },
    { id: 'contact', title: 'Contact', icon: '📧' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <motion.h1 
            className="text-xl font-bold text-gray-900 dark:text-white"
            whileTap={{ scale: 0.95 }}
          >
            Reu Uzziel
          </motion.h1>
          <motion.div 
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            whileTap={{ scale: 0.9 }}
          />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-20">
        {activeSection === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              >
                RU
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                Hi, I'm Reu Uzziel
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-gray-600 dark:text-gray-300"
              >
                UI/UX Designer & Web Developer
              </motion.p>
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { label: 'Projects', value: '15+' },
                { label: 'Experience', value: '3 Years' },
                { label: 'Clients', value: '10+' },
                { label: 'Reviews', value: '5★' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm"
                >
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {activeSection === 'about' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About Me</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                I'm passionate about crafting intuitive digital experiences that blend form and function. 
                Drawing from my computer science background and design experiences, I strive to create 
                solutions that make a positive impact.
              </p>
            </div>
            
            {/* Skills */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Figma', 'Tailwind CSS', 'Next.js', 'Node.js'].map((skill) => (
                  <motion.span
                    key={skill}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'projects' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((project) => (
                <motion.div
                  key={project}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                      P{project}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Project {project}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Description of project {project}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'contact' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Mobile Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-around py-2">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xl mb-1">{section.icon}</span>
              <span className="text-xs font-medium">{section.title}</span>
            </motion.button>
          ))}
        </div>
      </motion.nav>
    </div>
  )
}

export default MobileTest