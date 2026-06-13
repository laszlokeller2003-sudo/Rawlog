import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useChatStore } from '@/stores/useChatStore'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { buildDataContext } from '@/lib/dataContext'
import { streamChat } from '@/lib/ai'
import { ChatMessageBubble } from './ChatMessageBubble'
import { SuggestedPrompts } from './SuggestedPrompts'

export function ChatTab() {
  const { messages, addMessage, updateMessage, appendToMessage, pendingQuestion, setPendingQuestion } = useChatStore()
  const { entries } = useEntriesStore()
  const { habits } = useHabitsStore()
  const { goals } = useGoalsStore()
  const { profile } = useProfileStore()

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`
  }

  const handleSend = useCallback(async (content: string = input) => {
    const trimmed = content.trim()
    if (!trimmed || isSending) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setIsSending(true)

    // Add user message
    addMessage('user', trimmed)

    // Prepare context
    const dataContext = buildDataContext(entries, habits, goals, profile)

    // Build message history for API (include the new user message)
    const allMessages = [
      ...messages,
      { role: 'user' as const, content: trimmed, id: '', createdAt: '' },
    ].map((m) => ({ role: m.role, content: m.content }))

    // Create streaming assistant message
    const assistantMsg = addMessage('assistant', '')
    updateMessage(assistantMsg.id, { streaming: true })

    try {
      await streamChat(allMessages, dataContext, (chunk) => {
        appendToMessage(assistantMsg.id, chunk)
      })
    } catch {
      toast.error('Chat failed. Please try again.')
      updateMessage(assistantMsg.id, { content: 'Sorry, something went wrong. Please try again.' })
    } finally {
      updateMessage(assistantMsg.id, { streaming: false })
      setIsSending(false)
    }
  }, [input, isSending, messages, entries, habits, goals, profile, addMessage, updateMessage, appendToMessage])

  // Process pending question
  useEffect(() => {
    if (pendingQuestion) {
      const q = pendingQuestion
      setPendingQuestion(null)
      void handleSend(q)
    }
  }, [pendingQuestion, handleSend, setPendingQuestion])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={(prompt) => void handleSend(prompt)} />
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 flex items-end gap-2 bg-bg-surface">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none overflow-hidden focus:border-accent-red focus:outline-none transition-colors"
          placeholder="Ask your PA anything…"
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          style={{ maxHeight: '100px' }}
        />
        <motion.button
          className="w-10 h-10 rounded-full bg-accent-red flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40"
          onClick={() => void handleSend()}
          disabled={!input.trim() || isSending}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUp size={18} />
        </motion.button>
      </div>
    </div>
  )
}
