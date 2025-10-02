'use client'

import { useChatMode } from '@/hooks/useChatMode'

export default function PersonalChatToggle() {
  const { mode, setMode } = useChatMode()

  const isPersonal = mode === 'personal'
  const baseClasses = 'md:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full transition-colors'
  const stateClasses = isPersonal
    ? 'border border-pink-500/50 bg-pink-500/10 text-pink-600 dark:text-pink-300 hover:bg-pink-500/15'
    : 'border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/15'

  return (
    <button
      className={`${baseClasses} ${stateClasses}`}
      aria-label="Toggle Personal Chat Mode"
      onClick={() => setMode(isPersonal ? 'assistant' : 'personal')}
    >
      <span className="text-xs font-semibold">Chat</span>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border ${
          isPersonal
            ? 'bg-pink-500/20 border-pink-500/40'
            : 'bg-blue-500/20 border-blue-500/30'
        }`}
      >
        {isPersonal ? 'Personal' : 'Assistant'}
      </span>
    </button>
  )
}