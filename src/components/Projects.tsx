'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import ProjectCard from './ProjectCard'
import { Tilt } from 'react-tilt'

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  longDescription: string;
  technologies: string[];
  carouselImages?: string[];
}

const TAG_COLORS: { [key: string]: string } = {
  'AI': 'bg-mint-200 text-mint-900',
  'Chatbot': 'bg-mint-300 text-mint-900',
  'Hugging Face': 'bg-mint-400 text-mint-900',
  'Next.js': 'bg-mint-500 text-mint-900',
  'UI/UX': 'bg-purple-200 text-purple-900',
  'Development': 'bg-blue-200 text-blue-900',
  'Web': 'bg-indigo-200 text-indigo-900',
  'Direction': 'bg-pink-200 text-pink-900',
  'Strategy': 'bg-green-200 text-green-900',
  'Creative': 'bg-yellow-200 text-yellow-900',
  'Laravel': 'bg-orange-200 text-orange-900',
  'PHP': 'bg-blue-300 text-blue-900',
  'Livewire': 'bg-pink-300 text-pink-900',
  'Tailwind CSS': 'bg-teal-200 text-teal-900',
  'IoT': 'bg-cyan-200 text-cyan-900',
  'Analytics': 'bg-violet-200 text-violet-900',
  'Streaming': 'bg-rose-200 text-rose-900',
};

const SAMPLE_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'AI Chatbot Assistant',
    description: 'An intelligent chatbot powered by advanced NLP models',
    image: '/projects/Project1.png',
    tags: ['AI', 'Chatbot', 'Next.js'],
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com/example/project',
    longDescription: 'A sophisticated chatbot that uses natural language processing to provide intelligent responses.',
    technologies: ['Next.js', 'OpenAI', 'TailwindCSS', 'TypeScript']
  },
  {
    id: '2',
    title: 'VetCare Platform',
    description: 'A showcase of creative design work and UI/UX projects',
    image: '/projects/Project2.png',
    tags: ['UI/UX', 'Development', 'Web'],
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com/example/project',
    longDescription: 'A comprehensive veterinary care platform with appointment scheduling and patient management.',
    technologies: ['React', 'Framer Motion', 'TailwindCSS', 'Figma'],
    carouselImages: ['/projects/project2/image 9.png', '/projects/project2/image 10.png', '/projects/project2/image 11.png']
  },
  {
    id: '3',
    title: 'NoteAI Platform',
    description: 'A modern note-taking platform with AI features',
    image: '/projects/Project3.png',
    tags: ['Web', 'Development', 'AI'],
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com/example/project',
    longDescription: 'An intelligent note-taking platform with AI-powered organization and search capabilities.',
    technologies: ['Next.js', 'OpenAI', 'MongoDB', 'TailwindCSS']
  }
];

const Projects = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [[carouselPage, direction], setCarouselPage] = useState([0, 0]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Directly set the sample projects
    setProjects(SAMPLE_PROJECTS)
    setLoading(false)
  }, [])

  const setPage = (newPage: number) => {
    setCarouselPage(([currentPage, _]) => {
      if (newPage === currentPage) return [currentPage, _];
      const newDirection = newPage > currentPage ? 1 : -1;
      return [newPage, newDirection];
    });
  };

  useEffect(() => {
    if (!selectedProject || !selectedProject.carouselImages || selectedProject.carouselImages.length <= 1) return;

    const timeout = setTimeout(() => {
      if (selectedProject.carouselImages) {
        const newPage = (carouselPage + 1) % selectedProject.carouselImages.length;
        setCarouselPage([newPage, 1]);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [carouselPage, selectedProject]);

  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
    setCarouselPage([0, 0]);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  const defaultTiltOptions = {
    reverse: true,
    max: 20,
    perspective: 1500,
    scale: 1.02,
    speed: 1500,
    transition: true,
    axis: null,
    reset: true,
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    glare: false,
    "max-glare": 0,
  };

  if (loading) {
    return (
      <section id="projects" className="section-padding bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Loading projects...</h2>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="projects" className="section-padding bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Error: {error}</h2>
        </div>
      </section>
    )
  }

  return (
    <section id="projects" className="section-padding bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Here are some of my recent projects that showcase my skills and experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="w-full max-w-[380px] mx-auto"
            >
              <Tilt 
                options={defaultTiltOptions} 
                className="h-full transition-transform duration-500 ease-out will-change-transform"
              >
                <div 
                  onClick={() => handleOpenModal(project)} 
                  className="cursor-pointer h-full transform-gpu transition-all duration-500 ease-out hover:shadow-lg rounded-xl overflow-hidden hover:-translate-y-1 bg-[var(--bg-secondary)] border border-gray-800/20"
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
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-gray-400 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-3 py-1 text-sm rounded-full font-medium ${TAG_COLORS[tag] || 'bg-gray-800 text-gray-200'}`}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-[600px] aspect-square max-h-[80vh] overflow-y-auto relative border border-gray-800/20"
            >
              {selectedProject.carouselImages && selectedProject.carouselImages.length > 0 ? (
                <div className="relative w-full h-[300px]">
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                      key={carouselPage}
                      src={selectedProject.carouselImages[carouselPage]}
                      alt={`${selectedProject.title} slide ${carouselPage + 1}`}
                      className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
                      initial={{ opacity: 0, x: 300 * direction }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -300 * direction }}
                      transition={{ duration: 0.5 }}
                    />
                  </AnimatePresence>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {selectedProject.carouselImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPage(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          carouselPage === index ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-[300px]">
                  <Image
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover rounded-t-2xl"
                  />
                </div>
              )}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-all z-10 backdrop-blur-sm"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{selectedProject.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{selectedProject.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${TAG_COLORS[tag] || 'bg-gray-800 text-gray-200'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.technologies.map((tech, idx) => (
                      <span key={idx} className="bg-gray-800/50 text-gray-300 px-2 py-0.5 rounded-md text-xs font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  {selectedProject.liveUrl && (
                    <a
                      href={selectedProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      View Live
                    </a>
                  )}
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm rounded-lg border border-gray-600 hover:bg-gray-800/50 transition-colors"
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


