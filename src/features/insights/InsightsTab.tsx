import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateInsights } from '@/lib/ai'
import { buildDataContext } from '@/lib/dataContext'
import { useChatStore } from '@/stores/useChatStore'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { InsightCard } from './InsightCard'

// Three-dot pulsing animation for loading state
function LoadingDots() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-accent-red"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="text-text-secondary text-sm font-heading">PA is analyzing your data…</p>
    </div>
  )
}

export function InsightsTab() {
  const { insights, isGeneratingInsights, setInsights, setGeneratingInsights, lastInsightAt } = useChatStore()
  const { entries } = useEntriesStore()
  const { habits } = useHabitsStore()
  const { goals } = useGoalsStore()
  const { profile } = useProfileStore()

  const handleAnalyze = async () => {
    if (isGeneratingInsights) return
    setGeneratingInsights(true)
    try {
      const context = buildDataContext(entries, habits, goals, profile)
      const result = await generateInsights(context)
      setInsights(result)
      toast.success('Analysis complete')
    } catch {
      toast.error('Analysis failed. Try again.')
    } finally {
      setGeneratingInsights(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-2">
      {/* Analyze button */}
      <motion.button
        className="btn-primary rounded-lg mb-2"
        onClick={handleAnalyze}
        disabled={isGeneratingInsights}
        whileTap={{ scale: 0.97 }}
      >
        <Zap size={16} />
        {isGeneratingInsights ? 'Analyzing…' : 'Analyze My Life'}
      </motion.button>

      {/* Last analyzed timestamp */}
      {lastInsightAt && !isGeneratingInsights && (
        <p className="text-text-muted text-xs text-center mb-4">
          Last analyzed: {format(new Date(lastInsightAt), 'MMM d, HH:mm')}
        </p>
      )}

      {/* Loading state */}
      <AnimatePresence>
        {isGeneratingInsights && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingDots />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights grid */}
      {!isGeneratingInsights && insights.length > 0 && (
        <div className="mt-2">
          {insights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isGeneratingInsights && insights.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <span className="text-4xl mb-4">🤖</span>
          <p className="text-text-secondary text-sm leading-relaxed">
            Tap <span className="text-text-primary font-semibold">"Analyze My Life"</span> to get insights from your PA.
          </p>
        </div>
      )}
    </div>
  )
}
