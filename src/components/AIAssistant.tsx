'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { portfolioData } from '@/data/portfolio'

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
const formatMessageText = (text: string) => {
  // Split by line breaks and process each line
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Process bold text (**text** -> <strong>text</strong>)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    
    const formattedLine = parts.map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove asterisks and make bold
        const boldText = part.slice(2, -2);
        return <strong key={`${lineIndex}-${partIndex}`} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
    
    // Add line break after each line except the last one
    return (
      <span key={lineIndex}>
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

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Fallback to local response if API fails
      try {
        const fallbackResponse = await generateLocalResponse(inputValue, knowledgeBase)
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: fallbackResponse,
          isUser: false,
          timestamp: new Date()
        }
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
              className="w-80 h-96 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AIIcon />
                  <span className="font-medium">Raizel</span>
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
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {message.isUser ? message.text : formatMessageText(message.text)}
                    </div>
                  </div>
                ))}
                
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
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
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AIIcon />
          <span className="font-medium">Ask AI</span>
        </motion.button>
      </div>
    </>
  )
}
