'use client'

import { useEffect, useState } from 'react'

export type ChatMode = 'assistant' | 'personal'

export function useChatMode() {
  const [mode, setModeState] = useState<ChatMode>('assistant')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chatMode') as ChatMode | null
      if (saved === 'assistant' || saved === 'personal') {
        setModeState(saved)
      }
    } catch {}
  }, [])

  const setMode = (next: ChatMode) => {
    setModeState(next)
    try {
      localStorage.setItem('chatMode', next)
    } catch {}
    // Notify listeners across components
    window.dispatchEvent(new CustomEvent('chatmode-change', { detail: { mode: next } }))
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { mode: ChatMode } | undefined
      if (detail?.mode) setModeState(detail.mode)
    }
    window.addEventListener('chatmode-change', handler as EventListener)
    return () => window.removeEventListener('chatmode-change', handler as EventListener)
  }, [])

  return { mode, setMode }
}