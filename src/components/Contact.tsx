'use client'

import { useInView } from 'react-intersection-observer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ErrorBoundary from './ErrorBoundary'
import { useState } from 'react'
import { motion } from 'framer-motion'
import GameModal from './GameModal'

// Define the form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message must be less than 1000 characters'),
})

type ContactFormData = z.infer<typeof contactFormSchema>

interface SocialLink {
  url: string
  name: string
  color: string
  icon: JSX.Element
}

const Contact = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [gameModalOpen, setGameModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  })

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'reuazel@gmail.com'
  const location = process.env.NEXT_PUBLIC_LOCATION || 'Albay, Philippines'
  const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL || '#'
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/ReuAzel181'
  const dribbbleUrl = process.env.NEXT_PUBLIC_DRIBBBLE_URL || '#'
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || '+63 921 401 7503'
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+63 921 401 7593'
  const discordUsername = process.env.NEXT_PUBLIC_DISCORD_USERNAME || 'reuazel'

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false) // Reset success state before new submission
      
      console.log('Submitting form data:', data);
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      console.log('API Response:', result);

      if (!response.ok) {
        throw new Error(result.message || result.errors?.[0]?.message || 'Failed to send message')
      }
      
      setSubmitSuccess(true)
      reset() // This will reset the form data and validation states
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
      
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message. Please try again later.')
      setSubmitSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const socialLinks: SocialLink[] = [
    { 
      url: 'https://www.facebook.com/reu.azel/', 
      name: 'Reu Azel',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
        </svg>
      )
    },
    { 
      url: 'https://github.com/ReuAzel181', 
      name: 'ReuAzel181',
      color: 'bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.237 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      )
    },
    { 
      url: `https://discord.com/users/${discordUsername}`, 
      name: discordUsername,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )
    }
  ]

  return (
    <ErrorBoundary>
      <section ref={ref} id="contact" className="section-padding bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900 relative overflow-hidden z-10">
        {/* Decorative accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-tr from-secondary/20 to-transparent dark:from-secondary/30 rounded-full blur-3xl z-0" />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Contact Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col justify-center bg-transparent z-10"
            >
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-[#385780] dark:text-[#5A7A9D] drop-shadow-[0_0_10px_rgba(56,87,128,0.3)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Let's Connect!</h2>
                {/* Animated Waving Hand SVG */}
                <span className="inline-block cursor-pointer group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 72 72"
                    width="28"
                    height="28"
                    className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
                  >
                    <g>
                      <path fill="#FCEA2B" d="M36.001 12.001c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24z"/>
                      <path fill="#F1B31C" d="M36.001 60.001c-13.255 0-24-10.745-24-24 0-2.209 1.791-4 4-4s4 1.791 4 4c0 8.837 7.163 16 16 16s16-7.163 16-16c0-2.209 1.791-4 4-4s4 1.791 4 4c0 13.255-10.745 24-24 24z"/>
                      <path fill="#FFF" d="M36.001 20.001c-8.837 0-16 7.163-16 16 0 2.209 1.791 4 4 4s4-1.791 4-4c0-4.418 3.582-8 8-8s8 3.582 8 8c0 2.209 1.791 4 4 4s4-1.791 4-4c0-8.837-7.163-16-16-16z"/>
                      <ellipse cx="36" cy="36" rx="6" ry="6" fill="#F1B31C"/>
                    </g>
                    <g>
                      <path fill="#000" d="M28 34a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm20 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
                      <path fill="#000" d="M32 44c0 2.209 1.791 4 4 4s4-1.791 4-4"/>
                    </g>
                  </svg>
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                I'd love to hear from you! Whether you have a question, want to collaborate, or just want to say hi, feel free to reach out through any of these channels.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register('name')}
                    className={`w-full px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border ${
                      errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-800 hover:border-secondary dark:hover:border-secondary'
                    } focus:outline-none focus:ring-2 focus:ring-secondary text-gray-900 dark:text-gray-100 placeholder-gray-500`}
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register('email')}
                    className={`w-full px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border ${
                      errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-800 hover:border-secondary dark:hover:border-secondary'
                    } focus:outline-none focus:ring-2 focus:ring-secondary text-gray-900 dark:text-gray-100 placeholder-gray-500`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    {...register('message')}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border ${
                      errors.message ? 'border-red-500' : 'border-gray-200 dark:border-gray-800 hover:border-secondary dark:hover:border-secondary'
                    } focus:outline-none focus:ring-2 focus:ring-secondary text-gray-900 dark:text-gray-100 placeholder-gray-500`}
                    placeholder="Your message..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
                  )}
                </div>

                {submitError && (
                  <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-900/50 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-200">{submitError}</p>
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-3 rounded-lg bg-green-50/80 dark:bg-green-900/50 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-200">
                      Message sent successfully! I'll get back to you soon.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2 rounded-lg text-white font-medium ${
                    isSubmitting
                      ? 'bg-secondary/50 cursor-not-allowed'
                      : 'bg-secondary hover:bg-secondary/80'
                  } transition-colors duration-200 shadow-lg hover:shadow-secondary/20`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>

            {/* Right: Contact Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative z-20 space-y-6"
            >
              {/* Contact Methods Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div className="group">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-secondary dark:hover:border-secondary shadow-lg hover:shadow-secondary/20 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Email</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{contactEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="group">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-secondary dark:hover:border-secondary shadow-lg hover:shadow-secondary/20 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Location</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{location}</p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="group">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-secondary dark:hover:border-secondary shadow-lg hover:shadow-secondary/20 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Phone</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{phoneNumber}</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="group">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-secondary dark:hover:border-secondary shadow-lg hover:shadow-secondary/20 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">WhatsApp</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{whatsappNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${link.color} transition-all duration-300 hover:scale-105`}
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.name}</span>
                  </a>
                ))}
                
                {/* Hello Button - Only visible and clickable in dark mode */}
                <button
                  onClick={(e) => {
                    // Only work in dark mode
                    if (document.documentElement.classList.contains('dark')) {
                      setGameModalOpen(true)
                    } else {
                      e.preventDefault()
                    }
                  }}
                  className="hidden dark:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 cursor-pointer dark:cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-sm font-medium">Hello!</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* WebRTC Game Modal */}
        <GameModal 
          isOpen={gameModalOpen}
          onClose={() => setGameModalOpen(false)}
        />
      </section>
    </ErrorBoundary>
  )
}

export default Contact 