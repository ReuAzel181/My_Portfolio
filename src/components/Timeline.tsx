import { motion } from 'framer-motion'
import { useState } from 'react'

interface MusicItem {
  year: string;
  title: string;
  description: string;
  genre: string[];
  // Placeholder for album art URL
  cover?: string;
  audioFile?: string;
  youtubeLink?: string;
  credits?: string;
}

const musicData: MusicItem[] = [
  {
    year: '2024',
    title: 'Gising Sa Panaginip',
    description: 'A collaborative track featuring beats from Tatz Maven. A dreamy journey through Filipino-inspired soundscapes.',
    genre: ['Hip-Hop', 'Filipino', 'Collaboration'],
    cover: '/projects/Project1.png',
    audioFile: '/Music/Gising Sa Panaginip.MP3',
    youtubeLink: 'https://youtu.be/QIB9TrCjsVQ?si=xUSPENU7JMA1saJc',
    credits: 'Beat by Tatz Maven (Non-profit use)',
  },
  {
    year: '2023',
    title: 'City Lights',
    description: 'A synthwave track inspired by neon nights.',
    genre: ['Synthwave', 'Retro'],
    cover: '/projects/Project2.png',
  },
  {
    year: '2022',
    title: 'Sunset Drive',
    description: 'Chill beats for late night drives.',
    genre: ['Chill', 'Lo-fi'],
    cover: '/projects/Project3.png',
  },
  // Add more music items as needed
];

const Music = () => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)

  const handlePlay = (index: number) => {
    const item = musicData[index]
    
    if (!item.audioFile) {
      // If no audio file, open YouTube link if available
      if (item.youtubeLink) {
        window.open(item.youtubeLink, '_blank')
      }
      return
    }

    if (playingIndex === index && isPlaying) {
      // Stop current audio
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        setAudio(null)
        setIsPlaying(false)
        setPlayingIndex(null)
      }
    } else {
      // Stop any currently playing audio
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }

      // Create new audio element
      const newAudio = new Audio(item.audioFile)
      newAudio.volume = isMuted ? 0 : volume
      newAudio.addEventListener('ended', () => {
        setIsPlaying(false)
        setPlayingIndex(null)
        setAudio(null)
      })
      
      newAudio.play()
      setAudio(newAudio)
      setIsPlaying(true)
      setPlayingIndex(index)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audio) {
      audio.volume = isMuted ? 0 : newVolume
    }
  }

  const handleMute = () => {
    setIsMuted(!isMuted)
    if (audio) {
      audio.volume = !isMuted ? 0 : volume
    }
  }

  return (
    <section id="music" className="relative py-24 overflow-x-hidden bg-[var(--bg-primary)]">
      {/* Edge-to-edge soundwave SVG background */}
      <div className="absolute left-0 right-0 top-0 w-screen opacity-50 pointer-events-none select-none z-0">
        <svg viewBox="0 0 1920 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-32">
          <motion.path
            d="M0,60 Q480,20 960,60 T1920,60"
            stroke="var(--bg-tertiary)" strokeWidth="4" fill="transparent"
            animate={{ pathLength: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 3, repeatType: 'reverse' }}
          />
        </svg>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto relative z-10"
      >
        <div className="flex flex-col items-center">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-2 text-center heading-gradient drop-shadow-xl tracking-tight">
            My Music
          </h2>
          <div className="flex items-center gap-2 text-lg text-[var(--text-secondary)] font-medium">
            <svg xmlns='http://www.w3.org/2000/svg' className='w-7 h-7 text-[var(--button-hover)]' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19V6l12-2v13' /><circle cx='6' cy='18' r='3' /><circle cx='18' cy='16' r='3' /></svg>
            <span>Compilation of my original tracks & sound experiments</span>
          </div>
        </div>
      </motion.div>
      {/* Edge-to-edge horizontal scrollable carousel */}
      <div className="w-full overflow-x-auto pt-8 pb-12 scrollbar-thin scrollbar-thumb-[var(--bg-tertiary)] scrollbar-track-transparent">
        <div className="flex gap-10 justify-center min-w-max px-8">
          {musicData.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.06 }}
              className="relative min-w-[260px] max-w-xs flex-shrink-0 bg-[var(--bg-secondary)]/80 backdrop-blur-xl rounded-3xl shadow-xl border border-[var(--card-border)] hover:border-[var(--button-hover)] transition-all duration-300 group flex flex-col items-center pt-8 pb-6 px-4"
              style={{ boxShadow: '0 8px 32px 0 rgba(16,22,36,0.15)' }}
            >
              {/* Circular Album Art */}
              <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-4 border-[var(--bg-tertiary)] group-hover:border-[var(--button-hover)] transition-all duration-300 bg-gray-900 flex items-center justify-center">
                {item.cover ? (
                  <img src={item.cover} alt={item.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <span className="text-gray-400">Album Art</span>
                )}
                {/* Centered Play Button Overlay */}
                <button 
                  onClick={() => handlePlay(index)}
                  className="absolute inset-0 m-auto bg-[var(--button-bg)]/90 text-white rounded-full p-4 shadow-lg hover:bg-[var(--button-hover)] transition-colors flex items-center justify-center backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75z" />
                  </svg>
                </button>
                {/* Volume Controls */}
                {playingIndex === index && isPlaying && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-[var(--bg-secondary)]/80 backdrop-blur-sm rounded-full p-2">
                    <button
                      onClick={handleMute}
                      className="text-[var(--text-primary)] hover:text-[var(--button-hover)] transition-colors p-1"
                    >
                      {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, var(--button-hover) 0%, var(--button-hover) ${volume * 100}%, var(--bg-tertiary) ${volume * 100}%, var(--bg-tertiary) 100%)`
                      }}
                    />
                  </div>
                )}
                {/* Now Playing Animation */}
                {playingIndex === index && isPlaying && (
                  <div className="absolute top-2 right-2 flex gap-1 items-end h-6">
                    {[1, 2, 3, 4].map((bar) => (
                      <motion.div
                        key={bar}
                        initial={{ height: 4 }}
                        animate={{ height: [4, 16, 8, 12, 4][bar % 5] }}
                        transition={{ repeat: Infinity, duration: 0.7 + bar * 0.1, repeatType: 'reverse' }}
                        className="w-1 rounded bg-[var(--button-hover)]"
                        style={{ boxShadow: '0 0 6px var(--button-hover)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="flex flex-col items-center gap-1 w-full">
                <span className="text-xl font-bold text-[var(--text-primary)] text-center truncate w-full drop-shadow-sm">{item.title}</span>
                <span className="text-xs bg-[var(--bg-tertiary)]/40 px-2 py-1 rounded-full text-[var(--text-secondary)] mb-1 mt-1">{item.year}</span>
                <div className="text-[var(--text-secondary)] text-sm text-center mb-2 line-clamp-2 w-full">{item.description}</div>
                {item.credits && (
                  <div className="text-xs text-[var(--text-secondary)] text-center mb-2 italic">
                    {item.credits}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-auto">
                  {item.genre.map((g, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--button-hover)]/20 text-[var(--button-hover)] font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                {item.youtubeLink && (
                  <button
                    onClick={() => window.open(item.youtubeLink, '_blank')}
                    className="mt-3 flex items-center gap-2 text-xs text-[var(--button-hover)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                    Watch on YouTube
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        {/* Floating Now Playing mini-player bar */}
        {playingIndex !== null && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-8 right-0 left-0 mx-auto z-[9999] pointer-events-auto bg-[var(--bg-secondary)]/90 border border-[var(--button-hover)] rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl backdrop-blur-xl w-max"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--bg-tertiary)]">
              <img src={musicData[playingIndex].cover} alt={musicData[playingIndex].title} className="object-cover w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--text-primary)] font-semibold text-base">{musicData[playingIndex].title}</span>
              <span className="text-xs text-[var(--button-hover)]">Now Playing</span>
            </div>
            <div className="flex gap-1 items-end h-6 ml-2">
              {[1, 2, 3, 4].map((bar) => (
                <motion.div
                  key={bar}
                  initial={{ height: 8 }}
                  animate={isPlaying ? { height: [8, 20, 12, 18, 8][bar % 5] } : { height: 8 }}
                  transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.6 + bar * 0.1, repeatType: 'reverse' }}
                  className="w-1 rounded bg-[var(--button-hover)]"
                  style={{ boxShadow: '0 0 6px var(--button-hover)' }}
                />
              ))}
            </div>
            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMute}
                className="text-[var(--text-primary)] hover:text-[var(--button-hover)] transition-colors p-1"
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, var(--button-hover) 0%, var(--button-hover) ${(isMuted ? 0 : volume) * 100}%, var(--bg-tertiary) ${(isMuted ? 0 : volume) * 100}%, var(--bg-tertiary) 100%)`
                }}
              />
            </div>
            <button 
              onClick={() => handlePlay(playingIndex)}
              className="ml-2 bg-[var(--button-bg)] text-white rounded-full p-2 hover:bg-[var(--button-hover)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default Music 