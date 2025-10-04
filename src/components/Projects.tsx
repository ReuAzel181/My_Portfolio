'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Tilt } from 'react-tilt'
import { COLORS } from '@/lib/designTokens'

export interface Project {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  liveUrl?: string
  githubUrl?: string
  longDescription: string
  technologies: string[]
  carouselImages?: string[]
}

const TAG_COLORS: { [key: string]: string } = {
  AI: 'bg-mint-200 text-mint-900',
  Chatbot: 'bg-mint-300 text-mint-900',
  'Hugging Face': 'bg-mint-400 text-mint-900',
  'Next.js': 'bg-mint-500 text-mint-900',
  'UI/UX': 'bg-purple-200 text-purple-900',
  Development: 'bg-blue-200 text-blue-900',
  Web: 'bg-indigo-200 text-indigo-900',
  Direction: 'bg-pink-200 text-pink-900',
  Strategy: 'bg-green-200 text-green-900',
  Creative: 'bg-yellow-200 text-yellow-900',
  Laravel: 'bg-orange-200 text-orange-900',
  PHP: 'bg-blue-300 text-blue-900',
  Livewire: 'bg-pink-300 text-pink-900',
  'Tailwind CSS': 'bg-teal-200 text-teal-900',
  IoT: 'bg-cyan-200 text-cyan-900',
  Analytics: 'bg-violet-200 text-violet-900',
  Streaming: 'bg-rose-200 text-rose-900',
}

const SAMPLE_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'AI Chatbot Assistant',
    description: 'An intelligent chatbot powered by advanced NLP models',
    image: '/projects/Project1.png',
    tags: ['AI', 'Chatbot', 'Next.js'],
    githubUrl: 'https://github.com/example/project',
    longDescription:
      'A sophisticated chatbot that uses natural language processing to provide intelligent responses.',
    technologies: ['Next.js', 'OpenAI', 'TailwindCSS', 'TypeScript'],
  },
  {
    id: '2',
    title: 'VetCare Platform',
    description: 'A showcase of creative design work and UI/UX projects',
    image: '/projects/Project2.png',
    tags: ['UI/UX', 'Development', 'Web'],
    githubUrl: 'https://github.com/example/project',
    longDescription:
      'A comprehensive veterinary care platform with appointment scheduling and patient management.',
    technologies: ['React', 'Framer Motion', 'TailwindCSS', 'Figma'],
    carouselImages: [
      '/projects/project2/image 9.png',
      '/projects/project2/image 10.png',
      '/projects/project2/image 11.png',
    ],
  },
  {
    id: '3',
    title: 'NoteAI Platform',
    description: 'A modern note-taking platform with AI features',
    image: '/projects/Project3.png',
    tags: ['Web', 'Development', 'AI'],
    githubUrl: 'https://github.com/example/project',
    longDescription:
      'An intelligent note-taking platform with AI-powered organization and search capabilities.',
    technologies: ['Next.js', 'OpenAI', 'MongoDB', 'TailwindCSS'],
  },
  {
    id: '4',
    title: 'News Site',
    description: 'A modern news platform with personalized content',
    image: '/projects/Project4.png',
    tags: ['Web', 'Development', 'News'],
    liveUrl: 'https://veritas-bulletin.vercel.app/',
    githubUrl: 'https://github.com/ReuAzel181/News-Site',
    longDescription:
      'A fully responsive news website featuring categorized news sections, search functionality, and user-friendly design.',
    technologies: [
      'React',
      'Next.js',
      'TailwindCSS',
      'API Integration',
      'Node.js',
    ],
  },
]

const Projects = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [carouselPage, setCarouselPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setProjects(SAMPLE_PROJECTS)
      setLoading(false)
    } catch (err) {
      setError('Failed to load projects')
      setLoading(false)
    }
  }, [])

  const handleOpenModal = (project: Project) => {
    setSelectedProject(project)
    setCarouselPage(0)
  }

  const handleCloseModal = () => setSelectedProject(null)

  const defaultTiltOptions = {
    reverse: true,
    max: 20,
    perspective: 1500,
    scale: 1.02,
    speed: 1500,
    transition: true,
    axis: null,
    reset: true,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    glare: false,
    'max-glare': 0,
  }

  return (
    <section id="projects" className="bg-[var(--bg-primary)] px-4 md:px-16 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <h2 className="text-4xl font-bold mb-8 text-center text-[#385780] dark:text-[#5A7A9D]">
            Loading projects...
          </h2>
        ) : error ? (
          <h2 className="text-4xl font-bold mb-8 text-center text-[#385780] dark:text-[#5A7A9D]">
            Error: {error}
          </h2>
        ) : (
          <>
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-8"
            >
              <h2
                className="font-bold mb-3"
                style={{
                  fontSize: 'var(--font-size-section)',
                  color: COLORS.CONTEXTUAL.TITLE.LIGHT_BG,
                }}
              >
                Featured Projects
              </h2>
              <p
                className="max-w-xl mx-auto"
                style={{
                  color: COLORS.CONTEXTUAL.SUBTITLE.LIGHT_BG,
                  fontSize: 'var(--font-size-card)',
                }}
              >
                Here are some of my recent projects that showcase my skills and
                experience.
              </p>
            </motion.div>

            {/* ✅ Project grid: single column on mobile, scaling to 2 and 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 overflow-visible">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.2,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="w-full"
                >
                  <Tilt
                    options={defaultTiltOptions}
                    className="h-full transition-transform duration-500 ease-out will-change-transform"
                  >
                    <div
                      onClick={() => handleOpenModal(project)}
                      className="cursor-pointer h-full transform-gpu transition-all duration-500 ease-out hover:shadow-lg rounded-2xl md:rounded-2xl overflow-hidden hover:-translate-y-1 bg-[var(--bg-secondary)] border border-gray-800/20"
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                        <h3
                          className="font-bold"
                          style={{ fontSize: '18px' }}
                        >
                          {project.title}
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm rounded-full font-medium ${
                                TAG_COLORS[tag] ||
                                'bg-gray-800 text-gray-200'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Tilt>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="relative w-full max-w-2xl bg-[var(--bg-secondary)] border border-gray-800/20 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-4 md:p-5 border-b border-gray-800/15">
                <div>
                  <h3 className="text-lg md:text-xl font-bold">{selectedProject.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{selectedProject.description}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  aria-label="Close"
                  className="rounded-lg p-2 hover:bg-gray-700/20 transition"
                >
                  ✕
                </button>
              </div>

              {/* Media / Carousel */}
              <div className="relative w-full bg-black/5">
                {selectedProject.carouselImages && selectedProject.carouselImages.length > 0 ? (
                  <div className="relative">
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={selectedProject.carouselImages[carouselPage]}
                        alt={`${selectedProject.title} image ${carouselPage + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                      {selectedProject.carouselImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCarouselPage(i)}
                          className={`h-1.5 w-1.5 rounded-full ${i === carouselPage ? 'bg-white' : 'bg-white/40'}`}
                          aria-label={`Go to image ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={selectedProject.image}
                      alt={selectedProject.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                    />
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 md:p-5 space-y-4">
                <p className="text-gray-300 text-sm">
                  {selectedProject.longDescription}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.technologies.map((tech) => (
                    <span key={tech} className="px-3 py-1 text-xs rounded-full bg-gray-700/30 text-gray-200">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedProject.liveUrl && (
                    <a
                      href={selectedProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-mint-500 text-black font-medium hover:bg-mint-400 transition"
                    >
                      Visit Live
                    </a>
                  )}
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-700 text-white font-medium hover:bg-gray-600 transition"
                    >
                      View Code
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Projects
