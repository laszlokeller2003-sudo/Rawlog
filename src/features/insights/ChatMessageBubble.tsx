import { motion } from 'framer-motion'
import { format } from 'date-fns'
import type { ChatMessage } from '@/types'

interface ChatMessageBubbleProps {
  message: ChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
        <span className="whitespace-pre-wrap break-words">
          {message.content}
          {/* Blinking cursor while streaming */}
          {message.streaming && (
            <motion.span
              className="inline-block w-[2px] h-[14px] bg-text-secondary ml-[2px] align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </span>
      </div>

      <span className="text-xs text-text-muted mt-1 px-1">
        {format(new Date(message.createdAt), 'HH:mm')}
      </span>
    </motion.div>
  )
}
