import { motion } from 'framer-motion'
import type { Insight } from '@/types'

const TAG_STYLES: Record<string, string> = {
  warning: 'tag tag-warning',
  positive: 'tag tag-positive',
  tip: 'tag tag-tip',
  pattern: 'tag tag-pattern',
}

const TAG_LABELS: Record<string, string> = {
  warning: 'Warning',
  positive: 'Positive',
  tip: 'Tip',
  pattern: 'Pattern',
}

interface InsightCardProps {
  insight: Insight
  index: number
}

export function InsightCard({ insight, index }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className="bg-bg-card border border-border rounded-lg p-4 mb-3"
    >
      {/* Top row: emoji + tag chip */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-2xl leading-none">{insight.emoji}</span>
        <span className={TAG_STYLES[insight.tag] ?? 'tag tag-tip'}>
          {TAG_LABELS[insight.tag] ?? insight.tag}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-heading font-semibold text-text-primary text-[15px] leading-snug">
        {insight.title}
      </h3>

      {/* Body */}
      <p className="text-text-secondary text-sm leading-relaxed mt-2">
        {insight.body}
      </p>
    </motion.div>
  )
}
