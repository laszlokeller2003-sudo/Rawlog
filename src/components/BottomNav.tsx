import { Home, Plus, BarChart2, LayoutDashboard, Sparkles, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/useUIStore'
import { useChatStore } from '@/stores/useChatStore'
import { cn } from '@/lib/utils'
import type { TabId } from '@/types'

export function BottomNav() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab, openEntrySheet } = useUIStore()
  const { insights } = useChatStore()

  const handleTabPress = (id: TabId) => {
    if (id === 'log') return
    setActiveTab(id)
  }

  const isActive = (id: TabId) => activeTab === id

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-bg-surface border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-6 h-[64px]">
        {/* Home */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleTabPress('home')}
          className="flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 cursor-pointer"
          aria-label="Home"
        >
          <span className={cn(isActive('home') ? 'text-accent-red' : 'text-[#444444]')}>
            <Home size={20} />
          </span>
          <span className={cn('text-[9px] font-heading uppercase tracking-wider', isActive('home') ? 'text-accent-red' : 'text-[#444444]')}>
            {t('bottomNav.home')}
          </span>
        </motion.button>

        {/* Stats */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleTabPress('stats')}
          className="flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 cursor-pointer"
          aria-label="Stats"
        >
          <span className={cn(isActive('stats') ? 'text-accent-red' : 'text-[#444444]')}>
            <BarChart2 size={20} />
          </span>
          <span className={cn('text-[9px] font-heading uppercase tracking-wider', isActive('stats') ? 'text-accent-red' : 'text-[#444444]')}>
            {t('bottomNav.stats')}
          </span>
        </motion.button>

        {/* Log (center) */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            setActiveTab('log')
            openEntrySheet('fitness')
          }}
          className="flex flex-col items-center justify-center cursor-pointer"
          aria-label="Log entry"
        >
          <div className="w-[44px] h-[44px] rounded-full bg-accent-red flex items-center justify-center">
            <Plus size={24} color="white" />
          </div>
        </motion.button>

        {/* Dashboards */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleTabPress('dashboards')}
          className="flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 cursor-pointer"
          aria-label="Dashboards"
        >
          <span className={cn(isActive('dashboards') ? 'text-accent-red' : 'text-[#444444]')}>
            <LayoutDashboard size={20} />
          </span>
          <span className={cn('text-[9px] font-heading uppercase tracking-wider', isActive('dashboards') ? 'text-accent-red' : 'text-[#444444]')}>
            {t('bottomNav.data')}
          </span>
        </motion.button>

        {/* Insights */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleTabPress('insights')}
          className="flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 cursor-pointer relative"
          aria-label="Insights"
        >
          <span className={cn('relative', isActive('insights') ? 'text-accent-red' : 'text-[#444444]')}>
            <Sparkles size={20} />
            {insights.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-red block" />
            )}
          </span>
          <span className={cn('text-[9px] font-heading uppercase tracking-wider', isActive('insights') ? 'text-accent-red' : 'text-[#444444]')}>
            {t('bottomNav.pa')}
          </span>
        </motion.button>

        {/* Profile */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleTabPress('profile')}
          className="flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 cursor-pointer"
          aria-label="Profile"
        >
          <span className={cn(isActive('profile') ? 'text-accent-red' : 'text-[#444444]')}>
            <User size={20} />
          </span>
          <span className={cn('text-[9px] font-heading uppercase tracking-wider', isActive('profile') ? 'text-accent-red' : 'text-[#444444]')}>
            {t('bottomNav.me')}
          </span>
        </motion.button>
      </div>
    </nav>
  )
}
