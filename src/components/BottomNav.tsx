import { Home, Plus, BarChart2, LayoutDashboard, Sparkles, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/useUIStore'
import { useChatStore } from '@/stores/useChatStore'
import { cn } from '@/lib/utils'
import type { TabId } from '@/types'

interface NavTab {
  id: TabId
  label: string
  icon: React.ReactNode
}

export function BottomNav() {
  const { activeTab, setActiveTab, openEntrySheet } = useUIStore()
  const { insights } = useChatStore()

  const tabs: NavTab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={22} />,
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: <BarChart2 size={22} />,
    },
    {
      id: 'dashboards',
      label: 'Data',
      icon: <LayoutDashboard size={22} />,
    },
    {
      id: 'insights',
      label: 'PA',
      icon: <Sparkles size={22} />,
    },
    {
      id: 'profile',
      label: 'Me',
      icon: <User size={22} />,
    },
  ]

  const handleTabPress = (id: TabId) => {
    if (id === 'log') return // handled separately
    setActiveTab(id)
  }

  const isActive = (id: TabId) => activeTab === id

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-bg-surface border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-6 h-[72px]">
        {/* Home */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleTabPress('home')}
          className="flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 cursor-pointer"
          aria-label="Home"
        >
          <span className={cn(isActive('home') ? 'text-accent-red' : 'text-[#444444]')}>
            <Home size={22} />
          </span>
          <span
            className={cn(
              'text-[9px] font-heading uppercase tracking-wider',
              isActive('home') ? 'text-accent-red' : 'text-[#444444]'
            )}
          >
            Home
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
            <BarChart2 size={22} />
          </span>
          <span
            className={cn(
              'text-[9px] font-heading uppercase tracking-wider',
              isActive('stats') ? 'text-accent-red' : 'text-[#444444]'
            )}
          >
            Stats
          </span>
        </motion.button>

        {/* Log (center) */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            setActiveTab('log')
            // Default to opening substances, can be changed by home screen
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
            <LayoutDashboard size={22} />
          </span>
          <span
            className={cn(
              'text-[9px] font-heading uppercase tracking-wider',
              isActive('dashboards') ? 'text-accent-red' : 'text-[#444444]'
            )}
          >
            Data
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
            <Sparkles size={22} />
            {insights.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-red block" />
            )}
          </span>
          <span
            className={cn(
              'text-[9px] font-heading uppercase tracking-wider',
              isActive('insights') ? 'text-accent-red' : 'text-[#444444]'
            )}
          >
            PA
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
            <User size={22} />
          </span>
          <span
            className={cn(
              'text-[9px] font-heading uppercase tracking-wider',
              isActive('profile') ? 'text-accent-red' : 'text-[#444444]'
            )}
          >
            Me
          </span>
        </motion.button>
      </div>
    </nav>
  )
}
