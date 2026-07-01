import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
import { InsightsTab } from './InsightsTab'
import { ChatTab } from './ChatTab'
import { PlanTab } from './PlanTab'

export function InsightsScreen() {
  const { t } = useTranslation()
  const { insightsActiveTab, setInsightsActiveTab } = useUIStore()

  const TABS = [
    { id: 'insights' as const, label: t('ai.tabs.insights') },
    { id: 'chat' as const, label: t('ai.tabs.chat') },
    { id: 'plan' as const, label: t('ai.tabs.plan') },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 flex-shrink-0">
        <h1 className="font-heading font-bold text-xl text-text-primary mb-4">{t('ai.heading')}</h1>

        {/* Tab pills */}
        <div className="flex gap-2 mb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={cn('pill text-sm', insightsActiveTab === tab.id && 'active')}
              onClick={() => setInsightsActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-0 mt-3 flex-shrink-0" />

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {insightsActiveTab === 'insights' ? (
            <motion.div
              key="insights"
              className="absolute inset-0 overflow-y-auto"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.15 }}
            >
              <InsightsTab />
            </motion.div>
          ) : insightsActiveTab === 'plan' ? (
            <motion.div
              key="plan"
              className="absolute inset-0 overflow-y-auto"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15 }}
            >
              <PlanTab />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15 }}
            >
              <ChatTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
