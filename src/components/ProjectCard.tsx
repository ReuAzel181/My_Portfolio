'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Project } from './Projects'

interface ProjectCardProps {
  project: Project;
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
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <div className="group relative bg-[var(--bg-secondary)] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transform group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{project.title}</h3>
        <p className="text-[var(--text-secondary)] mb-4 line-clamp-2">{project.description}</p>
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-1 text-xs rounded-full font-medium ${TAG_COLORS[tag] || 'bg-gray-800 text-gray-200'}`}
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-800 text-gray-200">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectCard 