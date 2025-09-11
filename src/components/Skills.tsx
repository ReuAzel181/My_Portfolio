import { motion } from 'framer-motion'

interface Skill {
  name: string;
  level: number;
  category: string;
  icon: string;
}

interface DigitalPlaygroundTool {
  name: string;
  image: string;
  description: string;
  since: string;
}

const skills: Skill[] = [
  { name: 'React', level: 90, category: 'Frontend', icon: '/icons/react.png' },
  { name: 'TypeScript', level: 85, category: 'Frontend', icon: '/icons/typescript.png' },
  { name: 'Next.js', level: 88, category: 'Frontend', icon: '/icons/nextjs.png' },
  { name: 'Node.js', level: 82, category: 'Backend', icon: '/icons/nodejs.png' },
  { name: 'UI/UX Design', level: 85, category: 'Design', icon: '/icons/design.png' },
  { name: 'Tailwind CSS', level: 90, category: 'Frontend', icon: '/icons/tailwind.png' },
];

const categories = Array.from(new Set(skills.map(skill => skill.category)));

const digitalPlaygroundTools: DigitalPlaygroundTool[] = [
  {
    name: 'WordPress',
    image: '/Digital Playground/Wordpress.png',
    description: 'Built and managed blogs and business sites with custom themes and plugins.',
    since: '2021',
  },
  {
    name: 'Figma',
    image: '/Digital Playground/Figma.png',
    description: 'Go-to for collaborative UI/UX design and prototyping on client projects.',
    since: '2020',
  },
  {
    name: 'Godot',
    image: '/Digital Playground/Godot.png',
    description: 'Engine of choice for experimenting with 2D/3D game ideas and rapid prototyping.',
    since: '2022',
  },
  {
    name: 'Unity',
    image: '/Digital Playground/Unity.png',
    description: 'Developed interactive experiences and cross-platform games for various clients.',
    since: '2020',
  },
  {
    name: 'XD',
    image: '/Digital Playground/XD.png',
    description: 'Preferred for wireframing and interactive mockups during early design phases.',
    since: '2019',
  },
  {
    name: 'Photopea',
    image: '/Digital Playground/Photopea.png',
    description: 'Quick edits and PSD work handled directly in the browser for fast turnarounds.',
    since: '2021',
  },
  {
    name: 'Pixilart',
    image: '/Digital Playground/Pixilart.png',
    description: 'Created retro-style sprites and pixel graphics for indie projects and fun.',
    since: '2022',
  },
  {
    name: 'Sketchbook',
    image: '/Digital Playground/Sketchbook.png',
    description: 'Digital sketching and painting for illustrations and concept art.',
    since: '2018',
  },
];

const Skills = () => {
  return (
    <section id="digital-playground" className="section-padding py-16 relative min-h-screen px-16" style={{ background: 'linear-gradient(135deg, var(--bg-primary) 60%, var(--bg-secondary) 100%)' }}>
      {/* Gradient overlay for extra depth */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at top right, var(--card-bg) 0%, transparent 70%)' }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl font-extrabold mb-3 text-center text-[#385780] dark:text-[#5A7A9D]">
          Digital Playground
        </h2>
        <p className="text-center mb-8 text-[#385780] dark:text-[#5A7A9D] drop-shadow-[0_0_10px_rgba(56,87,128,0.3)] dark:drop-shadow-[0_0_10px_rgba(90,122,157,0.3)]" style={{ fontSize: '18px' }}>
          A collection of my favorite creative and development tools I use to bring ideas to life.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {digitalPlaygroundTools.map((tool, idx) => (
            <div key={tool.name} className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ 
                  type: 'tween', 
                  duration: 0.18, 
                  delay: idx * 0.03,
                  ease: 'easeOut'
                }}
                className="relative rounded-xl shadow-xl overflow-visible group cursor-pointer min-h-[240px] w-full flex flex-col items-center justify-center px-4 py-8 hover:shadow-2xl bg-[var(--card-bg)] border border-[var(--card-border)]"
                style={{ transform: 'translateZ(0)' }}
              >
                <img
                  src={tool.image}
                  alt={tool.name}
                  className="w-16 h-16 object-contain mb-4 z-30 transition-transform duration-300 group-hover:-translate-y-2"
                />
                {/* Tool name inside card by default, moves just below card on hover, always visible */}
                <span
                  className="text-lg font-bold text-center absolute left-0 right-0 mx-auto transition-all duration-300 ease-in-out"
                  style={{
                    color: 'var(--text-primary)',
                    bottom: '2rem',
                    zIndex: 15,
                    transform: 'translateY(0)',
                  }}
                >
                  <span className="block group-hover:translate-y-[70px] group-hover:opacity-100 opacity-100 transition-all duration-300 ease-in-out">
                    {tool.name}
                  </span>
                </span>
                {/* Description overlay on hover, semi-transparent gradient, no drop-shadow */}
                <div
                  className="absolute left-0 right-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 px-3 pb-6 pt-6 flex items-end justify-center h-full rounded-xl"
                  style={{
                    background: 'linear-gradient(0deg, rgba(96,165,250,0.60) 0%, rgba(191,219,254,0.40) 80%, transparent 100%)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <p className="text-sm text-center leading-relaxed font-medium" style={{color: 'var(--text-primary)'}}>
                    {tool.description}
                  </p>
                </div>
              </motion.div>
              {/* Tool name below the card only on hover, always visible, with more space */}
              <div className="h-8 flex items-center justify-center">
                <span className="text-lg font-bold text-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out" style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills