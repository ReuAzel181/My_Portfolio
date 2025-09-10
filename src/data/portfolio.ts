export interface PortfolioData {
  personal: {
    name: string
    title: string
    location: string
    email: string
    phone: string
    whatsapp: string
    bio: string
    experience: string
    education: string
    languages: string[]
  }
  skills: {
    frontend: string[]
    backend: string[]
    databases: string[]
    tools: string[]
    design: string[]
    other: string[]
  }
  projects: Array<{
    id: string
    name: string
    description: string
    longDescription: string
    technologies: string[]
    features: string[]
    challenges: string[]
    solutions: string[]
    category: 'web' | 'mobile' | 'desktop' | 'ui-design'
    status: 'completed' | 'in-progress' | 'planned'
    demoUrl?: string
    githubUrl?: string
    imageUrl?: string
    year: number
  }>
  services: Array<{
    name: string
    description: string
    deliverables: string[]
    timeline: string
    pricing: string
  }>
  achievements: Array<{
    title: string
    description: string
    date: string
    category: string
  }>
  testimonials: Array<{
    name: string
    role: string
    company: string
    feedback: string
    rating: number
  }>
  socialLinks: Array<{
    platform: string
    url: string
    username: string
  }>
  footer: {
    quickLinks: string[]
    contactInfo: string[]
    availability: string
    timezone: string
  }
}

export const portfolioData: PortfolioData = {
  personal: {
    name: "Reu Banta",
    title: "Aspiring Developer & UI/UX Designer",
    location: "Albay, Philippines",
    email: "reuazel@gmail.com",
    phone: "+63 921 401 7503",
    whatsapp: "+63 921 401 7593",
    bio: "Passionate aspiring developer focused on creating modern, user-centric web applications. I specialize in React ecosystem, TypeScript, and modern web technologies. I love turning complex problems into simple, beautiful, and intuitive solutions.",
    experience: "Currently learning and building projects in web development with focus on modern JavaScript frameworks, frontend development, and UI/UX design. Started as a frontend enthusiast and working towards becoming a full-stack developer through various personal projects and continuous learning.",
    education: "Self-taught developer with continuous learning through online courses, documentation, and hands-on projects. Building a strong foundation in computer science principles and modern web development practices.",
    languages: ["English (Fluent)", "Filipino (Native)", "Bicol (Native)"]
  },
  skills: {
    frontend: [
      "React", "Next.js", "TypeScript", "JavaScript (ES6+)", 
      "HTML5", "CSS3", "TailwindCSS", "Sass/SCSS", 
      "Framer Motion", "React Hook Form", "Zustand", "Redux"
    ],
    backend: [
      "Node.js", "Express.js", "Next.js API Routes", 
      "RESTful APIs", "GraphQL", "Prisma ORM", 
      "Authentication (JWT, OAuth)", "WebSockets"
    ],
    databases: [
      "MongoDB", "PostgreSQL", "MySQL", "SQLite", 
      "Firebase Firestore", "Supabase"
    ],
    tools: [
      "Git & GitHub", "VS Code", "Figma", "Adobe XD", 
      "Postman", "Docker", "Vercel", "Netlify", 
      "npm/yarn", "Webpack", "Vite"
    ],
    design: [
      "UI/UX Design", "Responsive Design", "Mobile-First Design", 
      "Design Systems", "Prototyping", "User Research", 
      "Accessibility (WCAG)", "Cross-browser Compatibility"
    ],
    other: [
      "AI Integration", "API Development", "Performance Optimization", 
      "SEO", "PWA Development", "Testing (Jest, Cypress)", 
      "Agile/Scrum", "Technical Writing"
    ]
  },
  projects: [
    {
      id: "portfolio-website",
      name: "Interactive Portfolio Website",
      description: "Modern portfolio with AI chat functionality and interactive features",
      longDescription: "A comprehensive portfolio website built with Next.js featuring an AI-powered chat assistant, interactive animations, hidden games, and modern UI/UX design. The site showcases my work and provides an engaging user experience with smooth transitions and responsive design.",
      technologies: ["Next.js", "React", "TypeScript", "TailwindCSS", "Framer Motion", "Hugging Face API"],
      features: [
        "AI-powered chat assistant with Hugging Face integration",
        "Interactive animations and micro-interactions",
        "Hidden easter egg games",
        "Responsive design for all devices",
        "Dark/light theme support",
        "Contact form with validation",
        "SEO optimized",
        "Progressive Web App (PWA) features"
      ],
      challenges: [
        "Implementing smooth animations without performance issues",
        "Integrating AI chat functionality",
        "Creating engaging interactive elements",
        "Optimizing for mobile devices"
      ],
      solutions: [
        "Used Framer Motion for optimized animations",
        "Implemented Hugging Face API with fallback responses",
        "Created modular component architecture",
        "Applied mobile-first design principles"
      ],
      category: "web",
      status: "completed",
      demoUrl: "https://reubanta.vercel.app",
      githubUrl: "https://github.com/ReuAzel181/portfolio",
      imageUrl: "/projects/portfolio.png",
      year: 2024
    },
    {
      id: "ecommerce-platform",
      name: "E-commerce Platform",
      description: "Full-stack shopping solution with user authentication and payment integration",
      longDescription: "A complete e-commerce platform featuring user authentication, product management, shopping cart functionality, order processing, and payment integration. Built with modern technologies and best practices for scalability and security.",
      technologies: ["React", "Node.js", "Express.js", "MongoDB", "Stripe API", "JWT"],
      features: [
        "User registration and authentication",
        "Product catalog with search and filtering",
        "Shopping cart and wishlist",
        "Secure payment processing with Stripe",
        "Order management system",
        "Admin dashboard for product management",
        "Email notifications",
        "Responsive design"
      ],
      challenges: [
        "Implementing secure payment processing",
        "Managing complex state for cart and user data",
        "Ensuring data security and validation",
        "Optimizing database queries for performance"
      ],
      solutions: [
        "Integrated Stripe for secure payments",
        "Used Redux for state management",
        "Implemented JWT for secure authentication",
        "Optimized MongoDB queries with indexing"
      ],
      category: "web",
      status: "completed",
      githubUrl: "https://github.com/ReuAzel181/ecommerce",
      imageUrl: "/projects/ecommerce.png",
      year: 2023
    },
    {
      id: "news-website",
      name: "Modern News Website",
      description: "Responsive news platform with categorized content and real-time updates",
      longDescription: "A modern news website featuring categorized articles, real-time updates, search functionality, and responsive design. The platform provides an excellent reading experience across all devices with optimized performance and SEO.",
      technologies: ["React", "Next.js", "TypeScript", "News API", "TailwindCSS"],
      features: [
        "Real-time news updates",
        "Category-based article organization",
        "Advanced search functionality",
        "Bookmark and save articles",
        "Social media sharing",
        "SEO optimized",
        "Fast loading with image optimization",
        "Mobile-responsive design"
      ],
      challenges: [
        "Handling large amounts of dynamic content",
        "Implementing efficient search functionality",
        "Optimizing performance for fast loading",
        "Managing API rate limits"
      ],
      solutions: [
        "Implemented pagination and lazy loading",
        "Used debounced search with caching",
        "Applied Next.js image optimization",
        "Implemented smart API caching strategies"
      ],
      category: "web",
      status: "completed",
      githubUrl: "https://github.com/ReuAzel181/news-site",
      imageUrl: "/projects/news.png",
      year: 2023
    },
    {
      id: "analytics-dashboard",
      name: "Business Analytics Dashboard",
      description: "Data visualization platform with interactive charts and real-time metrics",
      longDescription: "A comprehensive business intelligence dashboard featuring interactive data visualizations, real-time metrics, and customizable reports. The platform helps businesses make data-driven decisions with intuitive charts and analytics.",
      technologies: ["Next.js", "TypeScript", "D3.js", "Chart.js", "Prisma", "PostgreSQL"],
      features: [
        "Interactive data visualizations",
        "Real-time metrics and KPIs",
        "Customizable dashboard layouts",
        "Export reports to PDF/Excel",
        "User role management",
        "Data filtering and drilling down",
        "Responsive charts for mobile",
        "Dark/light theme support"
      ],
      challenges: [
        "Handling large datasets efficiently",
        "Creating responsive data visualizations",
        "Implementing real-time data updates",
        "Ensuring data accuracy and consistency"
      ],
      solutions: [
        "Implemented data pagination and virtualization",
        "Used D3.js for responsive SVG charts",
        "Applied WebSocket connections for real-time updates",
        "Implemented comprehensive data validation"
      ],
      category: "web",
      status: "completed",
      githubUrl: "https://github.com/ReuAzel181/analytics-dashboard",
      imageUrl: "/projects/analytics.png",
      year: 2024
    }
  ],
  services: [
    {
      name: "Frontend Development",
      description: "Modern, responsive web applications using React, Next.js, and TypeScript",
      deliverables: [
        "Responsive web application",
        "Cross-browser compatibility",
        "Performance optimization",
        "SEO implementation",
        "Documentation and deployment"
      ],
      timeline: "2-6 weeks depending on complexity",
      pricing: "Starting from $1,500"
    },
    {
      name: "Full-Stack Development",
      description: "Complete web solutions with frontend, backend, and database integration",
      deliverables: [
        "Full-stack web application",
        "Database design and implementation",
        "API development",
        "User authentication system",
        "Admin dashboard",
        "Testing and deployment"
      ],
      timeline: "4-12 weeks depending on features",
      pricing: "Starting from $3,000"
    },
    {
      name: "UI/UX Design",
      description: "User-centered design solutions for web and mobile applications",
      deliverables: [
        "User research and personas",
        "Wireframes and prototypes",
        "High-fidelity designs",
        "Design system creation",
        "Usability testing",
        "Design handoff to developers"
      ],
      timeline: "2-4 weeks depending on scope",
      pricing: "Starting from $800"
    },
    {
      name: "AI Integration",
      description: "Integrate AI capabilities into existing applications or build new AI-powered features",
      deliverables: [
        "AI feature implementation",
        "API integration",
        "Custom AI models",
        "Performance optimization",
        "Documentation and training"
      ],
      timeline: "1-4 weeks depending on complexity",
      pricing: "Starting from $1,200"
    },
    {
      name: "Technical Consulting",
      description: "Expert advice on technology stack, architecture, and best practices",
      deliverables: [
        "Technology assessment",
        "Architecture recommendations",
        "Code review and optimization",
        "Performance analysis",
        "Best practices documentation"
      ],
      timeline: "1-2 weeks",
      pricing: "$100/hour"
    }
  ],
  achievements: [
    {
      title: "Successfully delivered 15+ web projects",
      description: "Completed various web development projects for clients across different industries",
      date: "2021-2024",
      category: "Professional"
    },
    {
      title: "Built AI-powered applications",
      description: "Integrated AI capabilities into multiple projects using various APIs and models",
      date: "2024",
      category: "Technical"
    },
    {
      title: "Contributed to open-source projects",
      description: "Active contributor to various open-source projects and libraries",
      date: "2022-2024",
      category: "Community"
    }
  ],
  testimonials: [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "TechStart Inc.",
      feedback: "Reu delivered an exceptional e-commerce platform that exceeded our expectations. His attention to detail and technical expertise made the project a huge success.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "CEO",
      company: "DataViz Solutions",
      feedback: "The analytics dashboard Reu built for us has transformed how we visualize our data. The interactive charts and real-time updates are exactly what we needed.",
      rating: 5
    }
  ],
  socialLinks: [
    {
      platform: "GitHub",
      url: "https://github.com/ReuAzel181",
      username: "ReuAzel181"
    },
    {
      platform: "LinkedIn",
      url: "https://linkedin.com/in/reu-banta",
      username: "reu-banta"
    },
    {
      platform: "Dribbble",
      url: "https://dribbble.com/reubanta",
      username: "reubanta"
    }
  ],
  footer: {
    quickLinks: [
      "About", "Projects", "Services", "Skills", "Contact"
    ],
    contactInfo: [
      "reuazel@gmail.com",
      "+63 921 401 7503",
      "Albay, Philippines"
    ],
    availability: "Available for freelance projects",
    timezone: "GMT+8 (Philippine Time)"
  }
}

export default portfolioData