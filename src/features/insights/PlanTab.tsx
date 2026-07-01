import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FileText, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { useChatStore } from '@/stores/useChatStore'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { buildDataContext } from '@/lib/dataContext'
import { generateInsights } from '@/lib/ai'

// Simple markdown renderer for the plan
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-sm leading-relaxed text-text-secondary space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="text-base font-bold text-text-primary mt-4 first:mt-0 font-heading">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="text-lg font-bold text-text-primary mt-4 first:mt-0 font-heading">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('**') && line.endsWith('**'))
          return (
            <p key={i} className="font-semibold text-text-primary">
              {line.slice(2, -2)}
            </p>
          )
        if (line.startsWith('- ') || line.startsWith('• '))
          return (
            <div key={i} className="flex gap-2">
              <span className="text-accent-red flex-shrink-0 mt-0.5">•</span>
              <span>{line.slice(2)}</span>
            </div>
          )
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

export function PlanTab() {
  const { t } = useTranslation()
  const [plan, setPlan] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { entries } = useEntriesStore()
  const { habits } = useHabitsStore()
  const { goals } = useGoalsStore()
  const { profile } = useProfileStore()

  const handleGenerate = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const context = buildDataContext(entries, habits, goals, profile)

      const apiKey =
        import.meta.env.VITE_ANTHROPIC_API_KEY || ''

      const systemPrompt = `You are the LYFE AI PA. Analyze the user's life data and create a brutally honest, actionable 7-day improvement plan. Structure it with: Executive Summary, Top 3 Problem Areas (with data references), 7-Day Action Plan (day by day), and Key Metrics to Watch.`

      const userMsg = `Here is my life tracking data:\n${context}\n\nCreate my personalized 7-day improvement plan. Be specific, data-driven, and direct.`

      if (apiKey) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 3000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMsg }],
          }),
        })
        const result = await res.json()
        setPlan(result.content?.[0]?.text ?? t('ai.plan.noPlanGenerated'))
      } else {
        // Mock plan
        await new Promise((r) => setTimeout(r, 1500))
        const m = (key: string, opts?: Record<string, unknown>) => t(`ai.plan.mock.${key}`, opts as any)
        setPlan(
          `## ${m('execSummary')}\n\n${m('entriesLogged', { count: entries.length })} ${entries.length < 10 ? m('notEnoughData') : m('goodFoundation')}\n\n` +
          `## ${m('top3Title')}\n\n- **${m('sleepConsistency')}** — ${m('sleepConsistencyDesc')}\n- **${m('habitCompletion')}** — ${m('habitCompletionDesc', { count: habits.length })}\n- **${m('moodTracking')}** — ${m('moodTrackingDesc')}\n\n` +
          `## ${m('actionPlanTitle')}\n\n**${m('day12')}:** ${m('day12Desc')}\n**${m('day34')}:** ${m('day34Desc')}\n**${m('day56')}:** ${m('day56Desc')}\n**${m('day7')}:** ${m('day7Desc')}\n\n` +
          `## ${m('metricsTitle')}\n\n- ${m('metric1')}\n- ${m('metric2')}\n- ${m('metric3')}`
        )
      }
      toast.success(t('ai.plan.generated'))
    } catch {
      toast.error(t('ai.plan.generateFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading font-bold text-base text-text-primary">{t('ai.plan.title')}</h2>
          <p className="text-xs text-text-muted mt-0.5">{t('ai.plan.subtitle')}</p>
        </div>
        <motion.button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-red text-white text-xs font-bold"
          onClick={handleGenerate}
          disabled={isGenerating}
          whileTap={{ scale: 0.95 }}
        >
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw size={13} />
            </motion.div>
          ) : (
            <FileText size={13} />
          )}
          {isGenerating ? t('ai.plan.generating') : plan ? t('ai.plan.regenerate') : t('ai.plan.generatePlan')}
        </motion.button>
      </div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16 gap-4"
          >
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent-red"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
            <p className="text-text-muted text-sm">{t('ai.plan.buildingPlan')}</p>
          </motion.div>
        )}

        {!isGenerating && plan && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <MarkdownText text={plan} />
          </motion.div>
        )}

        {!isGenerating && !plan && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center px-6"
          >
            <span className="text-4xl mb-4">📋</span>
            <p className="text-text-secondary text-sm leading-relaxed">
              {t('ai.plan.emptyStateBefore')}{' '}
              <span className="text-text-primary font-semibold">{t('ai.plan.emptyStateBold')}</span>{' '}
              {t('ai.plan.emptyStateAfter')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
