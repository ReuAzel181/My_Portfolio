'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { portfolioData } from '@/data/portfolio'
import { useChatMode } from '@/hooks/useChatMode'

// AI Icon Component
const AIIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
    <path d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z" fill="currentColor"/>
    <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="currentColor"/>
  </svg>
)

// Send Icon Component
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
  </svg>
)

// Thinking Dots Component
const ThinkingDots = () => (
  <div className="flex space-x-1 items-center">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
)

// Function to format message text with proper bold and line breaks
const formatMessageText = (text: string, messageId: string) => {
  // Split by line breaks and process each line
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Process bold text (**text** -> <strong>text</strong>)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    
    const formattedLine = parts.map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove asterisks and make bold
        const boldText = part.slice(2, -2);
        return <strong key={`${messageId}-${lineIndex}-${partIndex}`} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
    
    // Add line break after each line except the last one
    return (
      <span key={`${messageId}-line-${lineIndex}`}>
        {formattedLine}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface KnowledgeBase {
  skills: string[]
  projects: Array<{
    name: string
    description: string
    technologies: string[]
  }>
  services: string[]
  experience: string
}

const knowledgeBase: KnowledgeBase = {
  skills: [
    ...portfolioData.skills.frontend,
    ...portfolioData.skills.backend,
    ...portfolioData.skills.databases,
    ...portfolioData.skills.tools,
    ...portfolioData.skills.design,
    ...portfolioData.skills.other
  ],
  projects: portfolioData.projects.map(project => ({
    name: project.name,
    description: project.description,
    technologies: project.technologies
  })),
  services: portfolioData.services.map(service => service.name),
  experience: portfolioData.personal.bio
}

// Personal favorites dataset for hybrid responses
const personalData = {
  movie: 'Interstellar',
  actor: 'Andrew Garfield, Tom Hanks',
  song: 'Solo Mission by Waiian',
  musician: 'Gorillaz, Maroon 5',
  book: 'PSCY 101',
  author: 'TPC',
  tvShow: 'Suits (2011–2019)',
  anime: 'Jujutsu Kaisen, Hunter x Hunter, Monster',
  food: 'Ramen',
  drink: 'Coffee (CMac), Carbonated (Royal)',
  dessert: 'Graham Bar',
  snack: 'Pier',
  color: 'Mint Blue – Calming',
  season: 'Rainy',
  day: 'Sunday (Attending church)',
  time: '11 PM when going to sleep',
  hobby: 'Reading books, watching anime',
  freeTime: 'Reading, watching anime, fixing things, tinkering with design',
  identity: 'I’m Raizel — your friendly personal assistant on this site',
  age: 'Early 20s',
  relationshipStatus: 'Private; keeping it friendly and focused here',
  sportWatch: 'Chess, UFC',
  sportPlay: 'Chess',
  outdoor: 'Planting',
  indoor: 'Fixing things',
  relaxPlace: 'Bedroom',
  city: 'Tagaytay',
  subject: 'Science, Philosophy, Psychology',
  teacher: 'Sir Cy (Philosophy Teacher)',
  memory: 'Everything — the feeling of being a kid',
  game: 'Chess, Mobile Legends, Sudoku',
  apps: 'TikTok, Minecraft, YouTube',
  quote: '“Ang comfort zone ay simenteryo ng ebolusyon.” – Gl',
  scent: 'Aqua Bergamot',
  animals: 'Fish, Mantis, Beetle, Spider',
  flowers: 'Sunflower, Orchids',
  brands: 'Infinity, Hiraya, Senioritos, Highmnds',
  relaxAfter: 'Sleeping',
  holiday: 'New Year',
  toy: 'Teks',
  aboutSelf: 'Always craves learning',
  skill: 'Designing',
  draw: 'Concepts like characters',
  creativityTool: 'Figma',
  inspire: 'My mom',
} as const

// Detect intent key for personal mode (greetings + favorites/topics)
function getPersonalIntentKey(message: string): string {
  const m = message.toLowerCase()
  // Use word boundaries to avoid matching substrings like 'yo' inside 'you'
  const greetingPattern = /\b(hello|hi|hey|yo|sup|wazzup|whats up|what's up|kumusta|kamusta|good morning|good evening)\b/
  if (greetingPattern.test(m)) return 'greeting'

  const checks: Array<[string[], keyof typeof personalData]> = [
    [["favorite movie","favourite movie","film"], 'movie'],
    [["favorite actor","favourite actor","actress"], 'actor'],
    [["favorite song","favourite song"], 'song'],
    [["favorite musician","favourite musician","band"], 'musician'],
    [["favorite book","favourite book","novel"], 'book'],
    [["favorite author","favourite author"], 'author'],
    [["favorite tv show","favourite tv show","series"], 'tvShow'],
    [["favorite anime","favourite anime","cartoon"], 'anime'],
    [["favorite food","favourite food"], 'food'],
    [["favorite drink","favourite drink","beverage"], 'drink'],
    [["favorite dessert","favourite dessert"], 'dessert'],
    [["favorite snack","favourite snack"], 'snack'],
    [["favorite color","favourite color","colour"], 'color'],
    [["favorite season","favourite season"], 'season'],
    [["favorite day","favourite day","day of the week"], 'day'],
    [["favorite time","favourite time","time of day"], 'time'],
    [["favorite hobby","favourite hobby","pastime"], 'hobby'],
    [["favorite sport to watch","favourite sport to watch","watch sport"], 'sportWatch'],
    [["favorite sport to play","favourite sport to play","play sport"], 'sportPlay'],
    [["outdoor activity"], 'outdoor'],
    [["indoor activity"], 'indoor'],
    [["place to relax"], 'relaxPlace'],
    [["favorite city","favourite city","visited city"], 'city'],
    [["favorite subject","favourite subject"], 'subject'],
    [["favorite teacher","favourite teacher"], 'teacher'],
    [["favorite childhood memory","favourite childhood memory"], 'memory'],
    [["favorite game","favourite game"], 'game'],
    [["favorite app","favourite app"], 'apps'],
    [["favorite quote","favourite quote"], 'quote'],
    [["favorite smell","favourite smell","scent","favorite scent","favourite scent","fav scent"], 'scent'],
    [["favorite animal","favourite animal"], 'animals'],
    [["favorite flower","favourite flower","plant"], 'flowers'],
    [["favorite brand","favourite brand","store"], 'brands'],
    [["relax after a long day"], 'relaxAfter'],
    [["who are you","what are you","who is raizel"], 'identity'],
    [["your age","how old are you","what is your age","age"], 'age'],
    [["free time","in free time","when you are bored","when you are bored or in free time","bored"], 'freeTime'],
    [["your hobby","your hobbies","hobbies","what is your hobbies"], 'hobby'],
    [["favorite holiday","favourite holiday","celebration"], 'holiday'],
    [["childhood toy"], 'toy'],
    [["favorite thing about yourself","favourite thing about yourself"], 'aboutSelf'],
    [["favorite skill","favourite skill"], 'skill'],
    [["favorite thing to draw","favourite thing to draw","design"], 'draw'],
    [["app or tool for creativity","creative tool"], 'creativityTool'],
    [["person who inspires","character who inspires","inspires you"], 'inspire'],
    [["relationship","status","are you single","single","married","do you have a girlfriend","girlfriend","do you have a boyfriend","boyfriend"], 'relationshipStatus'],
  ]
  for (const [phrases, key] of checks) {
    if (phrases.some(p => m.includes(p))) return key
  }
  return 'misc'
}

// Varied personal responses with repetition awareness and casual vibe
function generatePersonalResponse(message: string, repetitionCount: number): string | null {
  const m = message.toLowerCase()
  const intent = getPersonalIntentKey(m)

  // Greetings: casual, friendly, sometimes humorous
  if (intent === 'greeting') {
    const base = [
      "Wazzup! I’m Raizel. How’s your day going?",
      "Hey hey! Kumusta? Want to chat about anything fun?",
      "Yo! Hello there—I’m all ears. What’s on your mind?",
      "Kumusta! Chill lang tayo—fire away your questions.",
      "Hi! I’m Raizel—what are we curious about today?",
      "Hello hello! Ready when you are. Any topic works.",
      "Hey! What’s up? I’m here if you wanna chat.",
      "Yo! Let’s dive into something interesting—your call."
    ]
    const note = repetitionCount > 1 ? [
      "You’ve greeted me a couple times—love the energy 🙂",
      "Is this deja vu or are we vibing again?",
      "Haha, greeting streak unlocked. Keep it going!"
    ] : []
    const pick = base[(Math.floor(Math.random() * base.length) + repetitionCount) % base.length]
    const suffix = note.length && Math.random() < 0.6 ? ` ${note[Math.floor(Math.random() * note.length)]}` : ''
    return `${pick}${suffix}`
  }

  // Identity / age / free-time / hobby / relationship: natural phrasing
  if (['identity','age','freeTime','hobby','relationshipStatus'].includes(intent)) {
    switch (intent) {
      case 'identity': {
        const variants = [
          "I’m Raizel — the personal AI assistant for this portfolio.",
          "I’m Raizel, your guide around projects, skills, and ideas here.",
          "Call me Raizel; I help you explore and get answers fast."
        ]
        return variants[(Math.floor(Math.random() * variants.length) + repetitionCount) % variants.length]
      }
      case 'age': {
        const variants = [
          "I’m in my early 20s.",
          "Early 20s — young, curious, still learning tons.",
          "Around early 20s; curiosity keeps me moving."
        ]
        return variants[(Math.floor(Math.random() * variants.length) + repetitionCount) % variants.length]
      }
      case 'freeTime': {
        const variants = [
          "I read, watch anime, and tinker with design when free.",
          "Free time looks like reading, anime, and fixing little things.",
          "When bored: learn something, tweak designs, or watch anime."
        ]
        return variants[(Math.floor(Math.random() * variants.length) + repetitionCount) % variants.length]
      }
      case 'hobby': {
        const variants = [
          "Mostly reading and anime — with design tinkering on the side.",
          "Reading, anime, and sometimes chess or small design tweaks.",
          "Reading and anime are the staples; creative tinkering too."
        ]
        return variants[(Math.floor(Math.random() * variants.length) + repetitionCount) % variants.length]
      }
      case 'relationshipStatus': {
        const variants = [
          "I keep that private — here to chat and help.",
          "I don’t share relationship status; let’s focus on the fun stuff.",
          "That stays private; we can talk anime, projects, anything."
        ]
        return variants[(Math.floor(Math.random() * variants.length) + repetitionCount) % variants.length]
      }
    }
  }

  // Favorites and other topics: varied templates
  if (intent !== 'misc') {
    const key = intent as keyof typeof personalData
    const value = personalData[key]
    if (!value) return null
    // Special-case: anime liking questions
    if (key === 'anime' && (m.includes('like anime') || m.includes('do you like anime') || m.includes('love anime'))) {
      const variants = [
        `Yep — big fan of anime. Favorites: ${value}.`,
        `Absolutely! I’m into anime. Top picks: ${value}.`,
        `For sure — anime is a vibe. I like ${value}.`
      ]
      return variants[(Math.floor(Math.random() * variants.length) + repetitionCount) % variants.length]
    }
    const templates = [
      `Personal take: ${value}.`,
      `If you ask me—${value}.`,
      `Low-key obsessed with ${value}.`,
      `My go-to? ${value}.`,
      `I’d say ${value}.`,
      `I lean toward ${value}.`,
      `Hard to beat ${value}.`,
      `Probably ${value}—it just hits right.`,
    ]
    const repeatedNotes = repetitionCount > 1 ? [
      "You asked that earlier—consistency is a strength 😉",
      "We’ve covered that—still the same answer, promise.",
      "Haha, persistent! I like it. Same vibe though.",
      `Looping back—still ${value}.`,
    ] : []
    const main = templates[(Math.floor(Math.random() * templates.length) + repetitionCount) % templates.length]
    const tail = repeatedNotes.length && Math.random() < 0.7 ? ` ${repeatedNotes[Math.floor(Math.random() * repeatedNotes.length)]}` : ''
    return `${main}${tail}`
  }

  // No specific match: let fallback handle
  return null
}

// Casual fallback for personal mode, no website context
function generatePersonalFallbackResponse(message: string, repetitionCount: number): string {
  const casual = [
    "Hmm, interesting. Tell me more—I’m here for the vibes.",
    "I feel you. Wanna riff on that a bit?",
    "That’s a cool thought. What sparked it?",
    "Love that energy. Where do you wanna take this?",
    "Solid question. Want me to share a take or just vibe?",
    "Curious one. Care to add context or a direction?",
    "We can explore that. What angle are you thinking?",
    "I’m game—wanna go deep or keep it light?",
  ]
  const repeated = repetitionCount > 1 ? [
    "You’re circling back—are we testing my memory?",
    "We’re looping a bit—wanna dive deeper or switch topics?",
    "Haha, déjà vu! I’m still with you though."
  ] : []
  const base = casual[(Math.floor(Math.random() * casual.length) + repetitionCount) % casual.length]
  const note = repeated.length && Math.random() < 0.6 ? ` ${repeated[Math.floor(Math.random() * repeated.length)]}` : ''
  return `${base}${note}`
}

// Enhanced local response generation
const generateLocalResponse = async (message: string, context: KnowledgeBase): Promise<string> => {
  const lowerMessage = message.toLowerCase()
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greetings = [
      "Hi there! I'm Raizel, happy to help you explore this portfolio! What would you like to know?",
      "Hello! Thanks for stopping by. I'm here to answer any questions about the work showcased here.",
      "Hey! Great to meet you. Feel free to ask me anything about the projects, skills, or experience shown here."
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Skills and technologies
  if (lowerMessage.includes('skill') || lowerMessage.includes('technology') || lowerMessage.includes('tech') || lowerMessage.includes('stack')) {
    const techResponses = [
      "The main technologies used here include React, Next.js, TypeScript, and TailwindCSS for frontend development, plus Node.js and MongoDB for backend work. There's also some AI integration and modern design tools like Figma.",
      "This portfolio showcases work with modern web technologies - React ecosystem, TypeScript for type safety, and various backend technologies. Each project uses the right tools for the job.",
      "The tech stack focuses on React and Next.js for building user interfaces, with TypeScript for better code quality. Backend work includes Node.js and database management with MongoDB."
    ]
    return techResponses[Math.floor(Math.random() * techResponses.length)]
  }

  // Projects
  if (lowerMessage.includes('project') || lowerMessage.includes('work') || lowerMessage.includes('portfolio')) {
    return "You can see various projects showcased here, from web applications to UI/UX designs. Each project demonstrates different skills and approaches to solving real-world problems. Would you like to know more about any specific project?"
  }

  // Services
  if (lowerMessage.includes('service') || lowerMessage.includes('hire') || lowerMessage.includes('work together')) {
    return "Services include web development, UI/UX design, and technical consulting. The focus is on creating functional, user-friendly solutions that meet specific needs. Feel free to reach out if you'd like to discuss a project!"
  }

  // Experience
  if (lowerMessage.includes('experience') || lowerMessage.includes('background') || lowerMessage.includes('about')) {
    return "With several years of experience in web development, the work here represents a journey of continuous learning and growth. Each project has been an opportunity to explore new technologies and improve problem-solving skills."
  }

  // Default response
  const defaultResponses = [
    "That's an interesting question! I'm here to help you learn more about the work and experience showcased in this portfolio. What specific area interests you?",
    "Thanks for asking! There's quite a bit to explore here - from technical projects to design work. What would you like to know more about?",
    "I'd be happy to help you learn more about the projects, skills, or experience shown here. What catches your attention?"
  ]
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mode } = useChatMode()
  const [personalIntentCounts, setPersonalIntentCounts] = useState<Record<string, number>>({})
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const isPersonalActive = mode === 'personal' && isMobile

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsThinking(true)

    try {
      // Personal mode: only active on mobile; fully local, casual, repetition-aware, with webhook logging.
      if (isPersonalActive) {
        const intent = getPersonalIntentKey(inputValue)
        const nextCount = (personalIntentCounts[intent] || 0) + 1
        setPersonalIntentCounts(prev => ({ ...prev, [intent]: nextCount }))

        const personal = generatePersonalResponse(inputValue, nextCount) 
          ?? generatePersonalFallbackResponse(inputValue, nextCount)

        const delayMs = 1000 + Math.floor(Math.random() * 2000)
        await new Promise(res => setTimeout(res, delayMs))
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: personal,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        // Fire-and-forget webhook logging via server-side route to avoid CORS and credential exposure
        try {
          fetch('/api/personal-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage: inputValue, aiReply: personal })
          }).catch(() => {})
        } catch {}
        return
      }

      // Call the API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: knowledgeBase
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      }

      // Random thinking delay between 1–3 seconds before responding
      const delayMs = 1000 + Math.floor(Math.random() * 2000)
      await new Promise(res => setTimeout(res, delayMs))
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Fallback to local response if API fails
      try {
        let fallbackResponse: string
        if (mode === 'personal') {
          const intent = getPersonalIntentKey(inputValue)
          const nextCount = (personalIntentCounts[intent] || 0) + 1
          setPersonalIntentCounts(prev => ({ ...prev, [intent]: nextCount }))
          const personal = generatePersonalResponse(inputValue, nextCount) 
            ?? generatePersonalFallbackResponse(inputValue, nextCount)
          fallbackResponse = personal ?? await generateLocalResponse(inputValue, knowledgeBase)
        } else {
          fallbackResponse = await generateLocalResponse(inputValue, knowledgeBase)
        }
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: fallbackResponse,
          isUser: false,
          timestamp: new Date()
        }
        const delayMs = 1000 + Math.floor(Math.random() * 2000)
        await new Promise(res => setTimeout(res, delayMs))
        setMessages(prev => [...prev, aiMessage])
      } catch (fallbackError) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm having trouble responding right now. Please try again in a moment.",
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Invisible backdrop for click-outside detection */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* Fixed positioning container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`w-80 h-96 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${
                isPersonalActive ? 'bg-rose-50/95 border-rose-200/60' : 'bg-white/95 border-gray-200/50'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`${
                'text-white p-4 flex justify-between items-center'
              } ${isPersonalActive ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
                <div className="flex items-center space-x-2">
                  <AIIcon />
                  <span className="font-medium">{isPersonalActive ? 'Raizel • Personal' : 'Raizel'}</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-8">
                    Hi! I'm here to help you learn more about this portfolio. Ask me anything! <br/> Charot lang di ko pa to tapos haha!
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        message.isUser
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : isPersonalActive ? 'bg-rose-100 text-rose-900 rounded-bl-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {message.isUser ? message.text : formatMessageText(message.text, message.id)}
                    </div>
                  </div>
                ))}
                
                {isThinking && (
                  <div className="flex justify-start">
                  <div className={`${isPersonalActive ? 'bg-rose-100' : 'bg-gray-100'} p-3 rounded-2xl rounded-bl-md`}>
                    <ThinkingDots />
                  </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200/50">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isThinking}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    title="Send (Ctrl+Enter)"
                  >
                    <SendIcon />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">
                  Press Ctrl+Enter to send
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Chat Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group ring-1 ${
            isPersonalActive
              ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 ring-pink-300'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 ring-blue-300'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPersonalActive ? 'Open Personal Chat' : 'Open AI Chat'}
        >
          <AIIcon />
          <span className="font-medium">{isPersonalActive ? 'Personal Chat' : 'Ask AI'}</span>
        </motion.button>
      </div>
    </>
  )
}
