import { useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import i18n from '@/i18n'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUIStore } from '@/stores/useUIStore'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { initNotificationsFromProfile, requestPermission } from '@/lib/notifications'

// Lazy load screens for performance
const OnboardingFlow = lazy(() => import('@/features/onboarding/OnboardingFlow'))
const HomeScreen = lazy(() => import('@/features/home/HomeScreen'))
const LogScreen = lazy(() => import('@/features/log/LogScreen').then(m => ({ default: m.LogScreen })))
const StatsScreen = lazy(() => import('@/features/stats/StatsScreen').then(m => ({ default: m.StatsScreen })))
const DashboardsScreen = lazy(() => import('@/features/dashboards/DashboardsScreen').then(m => ({ default: m.DashboardsScreen })))
const InsightsScreen = lazy(() => import('@/features/insights/InsightsScreen').then(m => ({ default: m.InsightsScreen })))
const HabitsScreen = lazy(() => import('@/features/habits/HabitsScreen').then(m => ({ default: m.HabitsScreen })))
const ProfileScreen = lazy(() => import('@/features/profile/ProfileScreen').then(m => ({ default: m.ProfileScreen })))

// Shared UI
const BottomNav = lazy(() => import('@/components/BottomNav').then(m => ({ default: m.BottomNav })))
const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })))
const EntryBottomSheet = lazy(() => import('@/features/log/EntryBottomSheet').then(m => ({ default: m.EntryBottomSheet })))
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

// Loading fallback
function ScreenLoader() {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: '#080808' }}>
      <div style={{ color: '#444', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, letterSpacing: '0.1em' }}>
        LOADING...
      </div>
    </div>
  )
}

function AppContent() {
  const { profile } = useProfileStore()
  const { activeTab, isPaywallOpen } = useUIStore()

  // Show onboarding if not complete
  if (!profile.onboardingComplete) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <OnboardingFlow />
      </Suspense>
    )
  }

  function renderScreen() {
    switch (activeTab) {
      case 'home': return <HomeScreen />
      case 'log': return <LogScreen />
      case 'stats': return <StatsScreen />
      case 'dashboards': return <DashboardsScreen />
      case 'insights': return <InsightsScreen />
      case 'profile': return <HabitsScreen />
      default: return <HomeScreen />
    }
  }

  // Map 'profile' tab to show profile screen
  function renderActiveScreen() {
    if (activeTab === 'profile') {
      return <ProfileScreen />
    }
    // 'profile' tab actually goes to ProfileScreen
    // but we added HabitsScreen above by accident — fix:
    return renderScreen()
  }

  return (
    <div className="app-container">
      {/* Main screen area */}
      <div className="screen">
        <Suspense fallback={<ScreenLoader />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              {activeTab === 'home' && <HomeScreen />}
              {activeTab === 'log' && <LogScreen />}
              {activeTab === 'stats' && <StatsScreen />}
              {activeTab === 'dashboards' && <DashboardsScreen />}
              {activeTab === 'insights' && <InsightsScreen />}
              {activeTab === 'profile' && <ProfileScreen />}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>

      {/* Bottom Navigation */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>

      {/* Entry Bottom Sheet (global, above nav) */}
      <Suspense fallback={null}>
        <EntryBottomSheet />
      </Suspense>

      {/* Paywall Modal */}
      {isPaywallOpen && (
        <Suspense fallback={null}>
          <PaywallModal />
        </Suspense>
      )}
    </div>
  )
}

export default function App() {
  const { profile, updateProfile } = useProfileStore()

  // Apply dark background to document
  useEffect(() => {
    document.body.style.background = '#080808'
    document.documentElement.style.background = '#080808'
  }, [])

  // Sync i18next with the user's saved language preference — covers app
  // start (already saved), onboarding selection, and the profile toggle,
  // since all three write to the same profile.language field.
  useEffect(() => {
    if (i18n.language !== profile.language) {
      i18n.changeLanguage(profile.language)
    }
  }, [profile.language])

  // Auto-activate default categories if they are missing in profile
  useEffect(() => {
    const defaultIds = [
      'substances',
      'intimacy',
      'fitness',
      'sleep',
      'mood',
      'nutrition',
      'finance',
      'social',
      'work',
      'health',
    ]
    const current = profile.selectedCategories || []
    const missing = defaultIds.filter((id) => !current.includes(id as any))
    if (missing.length > 0) {
      updateProfile({
        selectedCategories: [...current, ...missing] as any[],
      })
    }
  }, [profile.selectedCategories, updateProfile])

  // Init notifications after onboarding
  const entries = useEntriesStore((s) => s.entries)
  useEffect(() => {
    if (!profile.onboardingComplete) return
    requestPermission().then((granted) => {
      if (granted) {
        const today = new Date().toISOString().split('T')[0]
        const todayCount = entries.filter((e) => e.timestamp.startsWith(today)).length
        initNotificationsFromProfile(profile, todayCount)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.onboardingComplete, profile.dailyReportEnabled, profile.dailyReportTime, profile.weeklyReportEnabled])

  return (
    <>
      <AppContent />
      <PWAInstallPrompt />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1C1C1C',
            color: '#F5F5F5',
            border: '1px solid #242424',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            padding: '10px 16px',
            boxShadow: 'none',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#1C1C1C' },
          },
          error: {
            iconTheme: { primary: '#FF2020', secondary: '#1C1C1C' },
          },
        }}
      />
    </>
  )
}
