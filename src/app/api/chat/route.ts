import { NextRequest, NextResponse } from 'next/server'
import { portfolioData } from '@/data/portfolio'

// Discord webhook function
async function sendToDiscord(userMessage: string, aiResponse: string) {
  const webhookUrl = 'https://discordapp.com/api/webhooks/1419602221787779082/VTOTr9Ygy52_dKtTvR5PSSeZF0TUZHTQHsKl8h3sGeMX91eZl-K8bC3CsqKjoq7rdzrn';
  
  try {
    const embed = {
      title: "💬 Portfolio AI Chat",
      color: 0x3B82F6, // Blue color
      fields: [
        {
          name: "👤 User Message",
          value: userMessage.length > 1000 ? userMessage.substring(0, 1000) + "..." : userMessage,
          inline: false
        },
        {
          name: "🤖 AI Response",
          value: aiResponse.length > 1000 ? aiResponse.substring(0, 1000) + "..." : aiResponse,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Portfolio AI Assistant"
      }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
    // Don't throw error to avoid breaking the chat functionality
  }
}

async function generateHuggingFaceResponse(message: string, context: any): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    console.warn('HUGGINGFACE_API_KEY not found, falling back to local responses');
    return generateSmartResponse(message, context);
  }

  try {
    // Create a context-aware prompt using comprehensive portfolio data
    const allSkills = [
      ...portfolioData.skills.frontend,
      ...portfolioData.skills.backend,
      ...portfolioData.skills.databases,
      ...portfolioData.skills.tools,
      ...portfolioData.skills.design,
      ...portfolioData.skills.other
    ];
    
    const contextPrompt = `You are Raizel, an AI assistant for Reu Banta's portfolio website. You are knowledgeable, friendly, and helpful. You can understand questions even with grammar mistakes or typos.

Portfolio Context:
- Name: ${portfolioData.personal.name}
- Title: ${portfolioData.personal.title}
- Experience: ${portfolioData.personal.experience}
- Location: ${portfolioData.personal.location}
- Bio: ${portfolioData.personal.bio}
- Skills: ${allSkills.join(', ')}
- Projects: ${portfolioData.projects.map(p => `${p.name} (${p.description}) - Technologies: ${p.technologies.join(', ')}`).join('; ')}
- Services: ${portfolioData.services.map(s => `${s.name}: ${s.description}`).join('; ')}

Instructions:
- Understand the user's intent even if there are grammar mistakes or typos
- Provide accurate information based on the portfolio context above
- Keep responses concise (2-3 sentences max) and professional but friendly
- Focus on the specific information requested about skills, projects, or services
- If asked about experience, be honest about the current learning journey

User Question: ${message}

Response:`;

    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: contextPrompt,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data[0] && data[0].generated_text) {
      let generatedText = data[0].generated_text.trim();
      
      // Clean up the response
      generatedText = generatedText.replace(/^Response:\s*/, '');
      generatedText = generatedText.replace(/User Question:.*$/g, '');
      generatedText = generatedText.trim();
      
      // Ensure the response is relevant and not too long
      if (generatedText.length > 300) {
        generatedText = generatedText.substring(0, 300) + '...';
      }
      
      // If the response seems irrelevant or too generic, fall back to local response
      if (generatedText.length < 10) {
        return generateSmartResponse(message, context);
      }
      
      return generatedText;
    }
    
    // Fallback to local response if no valid response from API
    return generateSmartResponse(message, context);
    
  } catch (error) {
    console.error('Error calling Hugging Face API:', error);
    return generateSmartResponse(message, context);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    // Try Hugging Face API first, fallback to local responses
    const response = await generateHuggingFaceResponse(message, context)

    // Send to Discord webhook (non-blocking)
    sendToDiscord(message, response).catch(error => {
      console.error('Discord webhook failed:', error);
    });

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

function generateSmartResponse(userMessage: string, context: any): string {
  const lowerMessage = userMessage.toLowerCase()
  
  // Language detection function
  const detectLanguage = (text: string): 'tagalog' | 'english' | 'mixed' => {
    const tagalogWords = ['ako', 'ikaw', 'siya', 'tayo', 'kayo', 'sila', 'ang', 'ng', 'sa', 'para', 'kung', 'kapag', 'pero', 'at', 'o', 'na', 'pa', 'ba', 'naman', 'lang', 'din', 'rin', 'kasi', 'kaya', 'saan', 'ano', 'sino', 'kailan', 'bakit', 'paano', 'maganda', 'ganda', 'pangit', 'mabait', 'masama', 'malaki', 'maliit', 'mahaba', 'maikli', 'kumusta', 'salamat', 'pasensya', 'sorry', 'oo', 'hindi', 'wala', 'meron', 'may', 'gusto', 'ayaw', 'mahal', 'single', 'taken', 'jowa', 'boyfriend', 'girlfriend', 'crush', 'love'];
    const englishWords = ['the', 'and', 'or', 'but', 'if', 'when', 'where', 'what', 'who', 'why', 'how', 'good', 'bad', 'big', 'small', 'long', 'short', 'hello', 'thanks', 'sorry', 'yes', 'no', 'have', 'want', 'like', 'love', 'single', 'taken', 'boyfriend', 'girlfriend', 'relationship'];
    
    const words = text.toLowerCase().split(/\s+/);
    let tagalogCount = 0;
    let englishCount = 0;
    
    words.forEach(word => {
      if (tagalogWords.includes(word)) tagalogCount++;
      if (englishWords.includes(word)) englishCount++;
    });
    
    if (tagalogCount > englishCount) return 'tagalog';
    if (englishCount > tagalogCount) return 'english';
    return 'mixed';
  };
  
  const detectedLanguage = detectLanguage(userMessage);
  
  // Helper function to check for keywords with typo tolerance
  const containsKeywords = (keywords: string[]) => {
    return keywords.some(keyword => {
      // Check exact match
      if (lowerMessage.includes(keyword)) return true;
      
      // Check for common typos/variations
      const variations: { [key: string]: string[] } = {
        'skill': ['skil', 'skills', 'skils'],
        'project': ['projet', 'projects', 'projets'],
        'experience': ['experiance', 'expirience', 'experince'],
        'service': ['servic', 'services', 'servics'],
        'contact': ['contac', 'contacts'],
        'hello': ['helo', 'hallo', 'hullo'],
        'technology': ['tech', 'tecnology', 'techology']
      };
      
      if (variations[keyword]) {
         return variations[keyword].some(variant => lowerMessage.includes(variant));
       }
      
      return false;
    });
  };
  
  // Special response for apologies
  if (containsKeywords(['sorry', 'pasensya', 'apologize', 'my bad', 'forgive'])) {
    const sorryResponses = {
      tagalog: "Ay, okay lang yan! Walang problema. Hindi mo naman kasalanan yun. Ano pa bang gusto mong malaman tungkol sa portfolio ko? 😊",
      english: "Hey, no worries at all! There's absolutely nothing to apologize for. You're being perfectly fine! What else would you like to know about my work? 😊",
      mixed: "Wala yon, para ka namang others. What else can I help you with? 😊"
    };
    return sorryResponses[detectedLanguage];
  }
  
  // Special response for relationship status questions
  if (containsKeywords(['single', 'taken', 'relationship', 'boyfriend', 'girlfriend', 'jowa', 'crush', 'dating', 'married', 'love life', 'status'])) {
    const relationshipResponses = {
      tagalog: "Haha! **Secreeeet!** 🤫 Pero mas interested ako sa coding kaysa sa love life ngayon. Speaking of relationships, gusto mo bang malaman yung relationship ko sa mga programming languages? 😄",
      english: "Haha! **Secreeeet!** 🤫 But honestly, I'm more committed to my code than anything else right now. Speaking of relationships, want to know about my relationship with different programming languages? 😄",
      mixed: "**Secreeeet!** 🤫 Haha! But seriously, mas focused ako sa development ngayon. Want to know about my tech stack instead? 😄"
    };
    return relationshipResponses[detectedLanguage];
  }
  
  // Greeting responses
  if (containsKeywords(['hello', 'hi', 'hey', 'greet'])) {
    return "Hi there! I'm Raizel, here to help you learn about this portfolio. You can ask about technical skills, projects, services, or anything else you're curious about. What interests you?"
  }
  
  // Skills and technologies
  if (containsKeywords(['skill', 'technology', 'tech', 'stack', 'know', 'can'])) {
    const allSkills = [
      ...portfolioData.skills.frontend,
      ...portfolioData.skills.backend,
      ...portfolioData.skills.databases,
      ...portfolioData.skills.tools,
      ...portfolioData.skills.design,
      ...portfolioData.skills.other
    ];
    return `I have experience in a wide range of technologies including: ${allSkills.slice(0, 8).join(', ')}, and many more. My main focus is on modern web development with React, Next.js, TypeScript, and full-stack solutions. Would you like to know about any specific technology?`
  }
  
  // Projects
  if (containsKeywords(['project', 'work', 'portfolio', 'build', 'made', 'create'])) {
    const projects = portfolioData.projects;
    if (projects.length > 0) {
      const featuredProject = projects[0]; // Always show the first project for consistency
      return `I'm excited to tell you about my work! Here's one of my featured projects: **${featuredProject.name}** - ${featuredProject.description}. I built it using ${featuredProject.technologies.join(', ')}. I have ${projects.length} projects total in my portfolio showcasing different aspects of my full-stack development skills. Would you like to hear about any specific project?`
    }
    return "I'm proud to share that my portfolio features several exciting projects including AI-powered applications, web platforms, and UI/UX designs. Each project demonstrates different technical skills and my approach to creative problem-solving."
  }
  
  // Services
  if (containsKeywords(['service', 'offer', 'hire', 'work together', 'provide', 'help'])) {
    const services = portfolioData.services.map(s => s.name);
    return `I'd love to help bring your ideas to life! My available services include: ${services.join(', ')}. I'm currently available for new projects and collaborations. Whether you need a full-stack web application, AI integration, or UI/UX design, I'd be thrilled to help make your vision a reality.`
  }
  
  // Experience and background
  if (containsKeywords(['experience', 'background', 'about', 'who', 'bio'])) {
    return `Thank you for asking about my background! I'm ${portfolioData.personal.name}, a ${portfolioData.personal.title} with ${portfolioData.personal.experience}. ${portfolioData.personal.bio} I'm based in ${portfolioData.personal.location} and genuinely enjoy working with cutting-edge technologies to create solutions that make a real impact.`
  }
  
  // Contact information
  if (containsKeywords(['contact', 'reach', 'email', 'get in touch', 'phone', 'call', 'message'])) {
    return `I'd absolutely love to hear from you! You can reach me at ${portfolioData.personal.email} or ${portfolioData.personal.phone}. ${portfolioData.footer.availability} and I'm in ${portfolioData.footer.timezone}. You can also use the contact form on this website or connect through the social media links. I typically respond within 24 hours because I'm always excited to discuss new opportunities and projects!`
  }
  
  // Skills and technology questions
  if (containsKeywords(['skills', 'technologies', 'tech stack', 'what can you do'])) {
    const allSkills = [
      ...portfolioData.skills.frontend,
      ...portfolioData.skills.backend,
      ...portfolioData.skills.databases,
      ...portfolioData.skills.tools,
      ...portfolioData.skills.design,
      ...portfolioData.skills.other
    ];
    return `I work with a wide range of technologies! My main skills include: ${allSkills.slice(0, 10).join(', ')}, and many more. I specialize in ${portfolioData.skills.frontend.slice(0, 3).join(', ')} for frontend development, and ${portfolioData.skills.backend.slice(0, 3).join(', ')} for backend work. Would you like to know more about any specific technology?`;
  }

  // Specific technology questions
  if (containsKeywords(['react'])) {
    const reactSkills = portfolioData.skills.frontend.filter(skill => skill.toLowerCase().includes('react'));
    return `React is a core technology in my skillset! I work with ${reactSkills.join(', ')} and use it extensively for building interactive user interfaces. My projects showcase advanced React patterns, hooks, and state management. It's combined with Next.js for optimal performance and SEO.`;
  }
  
  if (containsKeywords(['next.js', 'nextjs', 'next'])) {
    return `Next.js is one of my primary frameworks! It's listed in my frontend skills: ${portfolioData.skills.frontend.filter(skill => skill.toLowerCase().includes('next')).join(', ')}. I use it for server-side rendering, static site generation, and API routes. This very portfolio is built with Next.js and showcases modern development practices.`;
  }
  
  if (containsKeywords(['typescript', 'ts'])) {
    return `TypeScript is a key part of my development stack! It's one of my core frontend skills and I use it throughout my projects to ensure type safety and better developer experience. It helps catch errors early and makes code more maintainable and scalable.`;
  }
  
  if (containsKeywords(['ai', 'artificial intelligence', 'machine learning', 'ml'])) {
    const aiSkills = portfolioData.skills.other.filter(skill => skill.toLowerCase().includes('ai'));
    return `AI integration is one of my specialties! I have ${aiSkills.join(', ')} in my skillset. My portfolio includes AI-powered projects like chatbots and intelligent platforms. I work with various AI APIs and focus on creating AI-enhanced user experiences.`;
  }
  
  // Design-related questions
  if (containsKeywords(['design', 'ui', 'ux', 'interface', 'user experience'])) {
    const designSkills = portfolioData.skills.design;
    return `UI/UX design is a key strength! My design skills include: ${designSkills.join(', ')}. I focus on creating modern, responsive designs with attention to user experience. I use tools like Figma for design systems and specialize in creating beautiful, functional interfaces that users love.`;
  }
  
  // Services and pricing questions
  if (containsKeywords(['services', 'what do you offer', 'what can you build'])) {
    const servicesList = portfolioData.services.map(service => `${service.name} (${service.timeline})`).join(', ');
    return `I offer several services: ${servicesList}. Each service includes comprehensive deliverables and support. Would you like to know more about any specific service?`;
  }
  
  // Pricing or cost questions
  if (containsKeywords(['price', 'cost', 'rate', 'budget', 'money', 'payment'])) {
    const pricingInfo = portfolioData.services.map(service => `${service.name}: ${service.pricing}`).join(', ');
    return `Here's my pricing structure: ${pricingInfo}. Pricing varies based on scope, complexity, and specific requirements. For accurate quotes, it's best to discuss your project through the contact form. Free consultations are available to understand your needs and provide detailed proposals.`;
  }
  
  // Timeline questions
  if (containsKeywords(['time', 'deadline', 'how long', 'duration', 'schedule'])) {
    const timelineInfo = portfolioData.services.map(service => `${service.name}: ${service.timeline}`).join(', ');
    return `Project timelines vary by service type: ${timelineInfo}. The exact timeline depends on your specific requirements and project complexity. During our consultation, we'll discuss your timeline needs and create a realistic project schedule that works for you.`;
  }
  
  // Projects questions
  if (containsKeywords(['projects', 'work', 'portfolio', 'examples', 'what have you built'])) {
    const recentProjects = portfolioData.projects.slice(0, 3).map(project => `${project.name} (${project.year})`).join(', ');
    return `I've worked on several exciting projects including: ${recentProjects}. Each project showcases different aspects of my skills from ${portfolioData.projects[0].technologies.slice(0, 3).join(', ')} to full-stack development. Would you like to know more about any specific project?`;
  }
  
  // Language detection - check for non-English content
  const filipinoWords = ['ano', 'paano', 'saan', 'kailan', 'bakit', 'sino', 'kumusta', 'magkano', 'pwede', 'hindi', 'oo', 'salamat', 'paki', 'naman', 'lang', 'yung', 'mga', 'kasi', 'para', 'dito', 'doon', 'ganito', 'ganoon'];
  const spanishWords = ['que', 'como', 'donde', 'cuando', 'por', 'para', 'con', 'sin', 'hola', 'gracias', 'por favor', 'si', 'no'];
  const otherLanguageWords = ['什么', '怎么', '哪里', '什么时候', '为什么', 'こんにちは', 'ありがとう', 'どこ', 'いつ', 'なぜ', 'bonjour', 'merci', 'où', 'quand', 'pourquoi'];
  
  const hasFilipino = filipinoWords.some(word => lowerMessage.includes(word));
  const hasSpanish = spanishWords.some(word => lowerMessage.includes(word));
  const hasOtherLanguage = otherLanguageWords.some(word => userMessage.includes(word));
  
  if (hasFilipino) {
    return "Paki Englishh kaseeeeee!";
  }
  
  if (hasSpanish || hasOtherLanguage) {
    return "I can only understand and respond in English. Please ask your question in English! You can ask about skills, projects, services, or anything about this portfolio.";
  }
  
  // Enhanced default response with specific options
  return `I'm not sure I understand what you're asking about. Here are some things you can ask me:

📋 **About Me**: Ask about experience, background, bio, or education
💻 **Skills**: Ask about technologies, programming languages, or tools
🚀 **Projects**: Ask about work, portfolio examples, or what I've built  
🎨 **Design**: Ask about UI/UX, design skills, or creative work
💼 **Services**: Ask about what I offer, pricing, or timelines
📞 **Contact**: Ask about how to reach me or get in touch

Try asking something like "What are your skills?" or "Tell me about your projects!" I'm here to help! 😊`;
}