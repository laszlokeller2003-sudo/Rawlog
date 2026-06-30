import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Pencil,
  Download,
  Trash2,
  Shield,
  Bell,
  Globe,
  DollarSign,
  Cloud,
  Lock,
  Crown,
  Info,
  ExternalLink,
  X,
} from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useChatStore } from '@/stores/useChatStore'
import { useUIStore } from '@/stores/useUIStore'
import { exportJSON, exportCSV } from '@/lib/export'
import { supabase } from '@/lib/supabase'
import { signOut as supabaseSignOut, pushToSupabase } from '@/lib/sync'
import { requestPermission, getPermissionState } from '@/lib/notifications'
import { isTrialActive, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Currency, Language } from '@/types'
import { EditProfileForm } from './EditProfileForm'

// ─── SettingsRow ──────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactNode
  label: string
  value?: string | React.ReactNode
  onClick?: () => void
  danger?: boolean
  rightSlot?: React.ReactNode
  showChevron?: boolean
}

function SettingsRow({
  icon,
  label,
  value,
  onClick,
  danger = false,
  rightSlot,
  showChevron = true,
}: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#1A1A1A] text-left transition-colors',
        onClick ? 'cursor-pointer hover:bg-bg-elevated active:bg-bg-elevated' : 'cursor-default'
      )}
    >
      <span className={cn('text-[#444444] flex-shrink-0', danger && 'text-red-500')}>{icon}</span>
      <span className={cn('flex-1 text-sm font-body', danger ? 'text-red-500' : 'text-[#F5F5F5]')}>
        {label}
      </span>
      {rightSlot ? (
        <div className="flex items-center gap-2">{rightSlot}</div>
      ) : (
        <>
          {value && (
            <span className="text-[#888888] text-xs font-body mr-1">{value}</span>
          )}
          {onClick && showChevron && <ChevronRight size={16} className="text-[#444444]" />}
        </>
      )}
    </button>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

interface ToggleProps {
  enabled: boolean
  onChange: (v: boolean) => void
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none',
        enabled ? 'bg-accent-red' : 'bg-[#242424]'
      )}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
        style={{ left: enabled ? 18 : 2 }}
      />
    </button>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-6 pb-2">
      <p className="text-[#444444] text-[10px] font-heading uppercase tracking-widest">{label}</p>
    </div>
  )
}

// ─── PIN Setup ────────────────────────────────────────────────────────────────

interface PinSetupProps {
  onSave: (pin: string) => void
  onCancel: () => void
}

function PinSetup({ onSave, onCancel }: PinSetupProps) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')

  const handleDigit = (d: string) => {
    if (step === 'enter') {
      const next = pin + d
      if (next.length === 4) {
        setPin(next)
        setStep('confirm')
      } else {
        setPin(next)
      }
    } else {
      const next = confirm + d
      if (next.length === 4) {
        if (next === pin) {
          onSave(next)
        } else {
          toast.error('PINs do not match')
          setConfirm('')
          setPin('')
          setStep('enter')
        }
      } else {
        setConfirm(next)
      }
    }
  }

  const handleDelete = () => {
    if (step === 'enter') {
      setPin((p) => p.slice(0, -1))
    } else {
      if (confirm.length === 0) {
        setStep('enter')
        setPin('')
      } else {
        setConfirm((c) => c.slice(0, -1))
      }
    }
  }

  const current = step === 'enter' ? pin : confirm
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <div className="px-4 py-4 bg-bg-elevated border border-border rounded-lg mx-4 mb-2">
      <p className="text-[#F5F5F5] text-sm font-heading font-bold mb-1 text-center">
        {step === 'enter' ? 'Enter 4-digit PIN' : 'Confirm PIN'}
      </p>
      <div className="flex justify-center gap-3 my-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full border',
              i < current.length ? 'bg-accent-red border-accent-red' : 'border-[#444444]'
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {digits.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (d === '⌫') handleDelete()
              else if (d !== '') handleDigit(d)
            }}
            className={cn(
              'py-3 rounded-lg text-[#F5F5F5] font-heading font-bold text-lg transition-colors',
              d === '' ? 'pointer-events-none' : 'bg-bg-card hover:bg-[#242424] active:bg-[#2a2a2a]'
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-[#888888] text-xs py-2 hover:text-[#F5F5F5] transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Cloud Sync Modal ──────────────────────────────────────────────────────────

interface CloudSyncFormProps {
  onClose: () => void
}

function CloudSyncForm({ onClose }: CloudSyncFormProps) {
  const { updateProfile } = useProfileStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error('Email and password required')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      updateProfile({ cloudSyncEnabled: true })
      toast.success('Account created! Check your email to confirm.')
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error('Email and password required')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      updateProfile({ cloudSyncEnabled: true })
      toast.success('Signed in! Cloud sync enabled.')
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pb-4">
      <div className="bg-bg-elevated border border-border rounded-lg p-4 space-y-3">
        <p className="text-[#F5F5F5] text-sm font-heading font-bold">Enable Cloud Sync</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-[#F5F5F5] text-sm placeholder:text-[#444444] focus:outline-none focus:border-accent-red transition-all"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-[#F5F5F5] text-sm placeholder:text-[#444444] focus:outline-none focus:border-accent-red transition-all"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex-1 bg-bg-card border border-border text-[#F5F5F5] text-sm font-heading py-2.5 rounded-lg hover:border-[#444444] transition-colors disabled:opacity-50"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 bg-accent-red text-white text-sm font-heading py-2.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Sign Up'}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full text-[#444444] text-xs hover:text-[#888888] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

const CURRENCY_CYCLE: Currency[] = ['EUR', 'USD', 'GBP']

export function ProfileScreen() {
  const { profile, authUserId, updateProfile, clearAll: clearProfile } = useProfileStore()
  const { entries, clearAll: clearEntries } = useEntriesStore()
  const { clearAll: clearHabits } = useHabitsStore()
  const { clearAll: clearGoals } = useGoalsStore()
  const { clearAll: clearChat } = useChatStore()
  const { openPaywall } = useUIStore()

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [pinSetupOpen, setPinSetupOpen] = useState(false)
  const [cloudSyncFormOpen, setCloudSyncFormOpen] = useState(false)
  const [notifPermission, setNotifPermission] = useState(() => getPermissionState())

  const handleRequestNotifPermission = async () => {
    const granted = await requestPermission()
    setNotifPermission(granted ? 'granted' : 'denied')
    if (granted) toast.success('Notifications enabled!')
    else toast.error('Notifications blocked in browser settings')
  }

  const trialActive = isTrialActive(profile.trialStartedAt)
  const trialDaysLeft = profile.trialStartedAt
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(profile.trialStartedAt).getTime()) / 86400000))
    : 0

  // Profile initials
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLanguageToggle = () => {
    updateProfile({ language: profile.language === 'en' ? 'de' : 'en' })
    toast.success(`Language changed to ${profile.language === 'en' ? 'Deutsch' : 'English'}`)
  }

  const handleCurrencyCycle = () => {
    const idx = CURRENCY_CYCLE.indexOf(profile.currency)
    const next = CURRENCY_CYCLE[(idx + 1) % CURRENCY_CYCLE.length]
    updateProfile({ currency: next })
    toast.success(`Currency: ${next}`)
  }

  const handleExportData = () => {
    const data = {
      profile: profile,
      entries: entries,
      exportedAt: new Date().toISOString(),
    }
    exportJSON(data, 'lyfe-export.json')
    exportCSV(entries, 'lyfe-entries.csv')
    toast.success('Exported JSON + CSV')
  }

  const handleDeleteAllData = () => {
    if (!window.confirm('Delete ALL data? This cannot be undone.')) return
    clearEntries()
    clearHabits()
    clearGoals()
    clearChat()
    clearProfile()
    toast.success('All data deleted')
  }

  const handleAppLockToggle = (val: boolean) => {
    if (val) {
      setPinSetupOpen(true)
    } else {
      updateProfile({ appLockEnabled: false, appLockPin: undefined })
      toast.success('App lock disabled')
    }
  }

  const handlePinSave = (pin: string) => {
    updateProfile({ appLockEnabled: true, appLockPin: pin })
    setPinSetupOpen(false)
    toast.success('PIN set — app lock enabled')
  }

  const handleCloudSyncToggle = (val: boolean) => {
    if (val) {
      setCloudSyncFormOpen(true)
    } else {
      updateProfile({ cloudSyncEnabled: false })
      toast.success('Cloud sync disabled')
    }
  }

  const handleSyncNow = async () => {
    const { authUserId } = useProfileStore.getState()
    if (!authUserId) {
      toast.error('Sign in to enable cloud sync')
      return
    }
    const t = toast.loading('Syncing…')
    await pushToSupabase(authUserId)
    toast.success('Synced!', { id: t })
  }

  const handleSignOut = async () => {
    if (!window.confirm('Sign out of your account?')) return
    try {
      await supabaseSignOut()
      updateProfile({ cloudSyncEnabled: false })
      toast.success('Signed out')
    } catch {
      toast.error('Sign out failed')
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* ── Profile Card ── */}
      <div className="px-4 pt-6 pb-4">
        <div className="bg-bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent-red flex items-center justify-center text-white font-heading font-bold text-2xl">
                {initials || '?'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-[20px] text-[#F5F5F5] truncate">
              {profile.name || 'Your Name'}
            </p>
            {/* Premium badge */}
            <div className="mt-1">
              {profile.isPremium ? (
                <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-500 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  ✓ Premium
                </span>
              ) : trialActive ? (
                <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Trial: {trialDaysLeft} days left
                </span>
              ) : (
                <button
                  onClick={() => openPaywall()}
                  className="inline-flex items-center gap-1 bg-accent-red/20 text-accent-red text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-md hover:bg-accent-red/30 transition-colors"
                >
                  Upgrade →
                </button>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditProfileOpen(true)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#444444] hover:text-[#F5F5F5] transition-colors"
            aria-label="Edit profile"
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {/* ── Sign In / Create Account (shown when not authenticated) ── */}
      {!authUserId && (
        <div className="px-4 pb-2">
          <AnimatePresence mode="wait">
            {cloudSyncFormOpen ? (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <CloudSyncForm onClose={() => setCloudSyncFormOpen(false)} />
              </motion.div>
            ) : (
              <motion.button
                key="auth-cta"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setCloudSyncFormOpen(true)}
                className="w-full bg-bg-card border border-accent-red/40 rounded-lg p-4 flex items-center gap-3 text-left hover:border-accent-red/70 transition-colors"
              >
                <Cloud size={18} className="text-accent-red flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[#F5F5F5] text-sm font-heading font-bold">Sign In / Create Account</p>
                  <p className="text-[#888888] text-xs mt-0.5">Back up your data · Enable AI chat · Sync across devices</p>
                </div>
                <ChevronRight size={16} className="text-[#444444]" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Edit Profile Bottom Sheet ── */}
      <AnimatePresence>
        {editProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => setEditProfileOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-bg-surface border-t border-border rounded-t-2xl"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#1A1A1A]">
                <h3 className="font-heading font-bold text-base text-[#F5F5F5]">Edit Profile</h3>
                <button
                  onClick={() => setEditProfileOpen(false)}
                  className="w-7 h-7 flex items-center justify-center text-[#888888] hover:text-[#F5F5F5] transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[80vh] p-4">
                <EditProfileForm onClose={() => setEditProfileOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACCOUNT ── */}
      <SectionHeader label="Account" />
      <div className="border-t border-[#1A1A1A]">
        <SettingsRow
          icon={<Pencil size={16} />}
          label="Edit Profile"
          onClick={() => setEditProfileOpen(true)}
        />
        <SettingsRow
          icon={<Globe size={16} />}
          label="Language"
          value={profile.language === 'en' ? 'English' : 'Deutsch'}
          onClick={handleLanguageToggle}
        />
        <SettingsRow
          icon={<DollarSign size={16} />}
          label="Currency"
          value={profile.currency}
          onClick={handleCurrencyCycle}
        />
        {authUserId ? (
          <SettingsRow
            icon={<Cloud size={16} />}
            label="Sync Now"
            onClick={handleSyncNow}
          />
        ) : null}
        {authUserId ? (
          <SettingsRow
            icon={<X size={16} />}
            label="Sign Out"
            danger
            onClick={handleSignOut}
          />
        ) : null}
      </div>

      {/* ── NOTIFICATIONS ── */}
      <SectionHeader label="Notifications" />
      <div className="border-t border-[#1A1A1A]">
        {notifPermission !== 'granted' && (
          <SettingsRow
            icon={<Bell size={16} />}
            label={notifPermission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
            value={notifPermission === 'denied' ? 'Allow in browser settings' : 'Tap to enable'}
            onClick={notifPermission !== 'denied' ? handleRequestNotifPermission : undefined}
          />
        )}
        <SettingsRow
          icon={<Bell size={16} />}
          label="Daily Report"
          showChevron={false}
          rightSlot={
            <div className="flex items-center gap-2">
              {profile.dailyReportEnabled && (
                <input
                  type="time"
                  value={profile.dailyReportTime}
                  onChange={(e) => updateProfile({ dailyReportTime: e.target.value })}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 text-[#F5F5F5] text-xs focus:outline-none focus:border-accent-red [color-scheme:dark]"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <Toggle
                enabled={profile.dailyReportEnabled}
                onChange={(v) => updateProfile({ dailyReportEnabled: v })}
              />
            </div>
          }
        />
        <SettingsRow
          icon={<Bell size={16} />}
          label="Weekly Report"
          showChevron={false}
          rightSlot={
            <Toggle
              enabled={profile.weeklyReportEnabled}
              onChange={(v) => updateProfile({ weeklyReportEnabled: v })}
            />
          }
        />
        <SettingsRow
          icon={<Bell size={16} />}
          label="Monthly Report"
          showChevron={false}
          rightSlot={
            <Toggle
              enabled={profile.monthlyReportEnabled}
              onChange={(v) => updateProfile({ monthlyReportEnabled: v })}
            />
          }
        />
      </div>

      {/* ── SECURITY ── */}
      <SectionHeader label="Security" />
      <div className="border-t border-[#1A1A1A]">
        <SettingsRow
          icon={<Lock size={16} />}
          label="App Lock (PIN)"
          showChevron={false}
          rightSlot={
            <Toggle
              enabled={profile.appLockEnabled}
              onChange={handleAppLockToggle}
            />
          }
        />
      </div>

      {/* PIN Setup */}
      <AnimatePresence>
        {pinSetupOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <PinSetup onSave={handlePinSave} onCancel={() => setPinSetupOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DATA & PRIVACY ── */}
      <SectionHeader label="Data & Privacy" />
      <div className="border-t border-[#1A1A1A]">
        <SettingsRow
          icon={<Download size={16} />}
          label="Export Data"
          value="JSON + CSV"
          onClick={handleExportData}
        />
        <SettingsRow
          icon={<Cloud size={16} />}
          label="Cloud Sync"
          showChevron={false}
          rightSlot={
            <Toggle
              enabled={profile.cloudSyncEnabled}
              onChange={handleCloudSyncToggle}
            />
          }
        />
        <SettingsRow
          icon={<Trash2 size={16} />}
          label="Delete All Data"
          danger
          onClick={handleDeleteAllData}
        />
      </div>

      {/* Cloud Sync Form — only for authenticated users re-entering credentials */}
      <AnimatePresence>
        {authUserId && cloudSyncFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CloudSyncForm onClose={() => setCloudSyncFormOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREMIUM ── */}
      <SectionHeader label="Premium" />
      <div className="px-4">
        {profile.isPremium ? (
          <div className="border border-green-500/30 rounded-lg p-4 flex items-center gap-3 bg-green-500/5">
            <Crown size={20} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="text-[#F5F5F5] text-sm font-heading font-bold">Premium Active ✓</p>
              <p className="text-[#888888] text-xs mt-0.5">All features unlocked</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openPaywall()}
            className="w-full border-2 border-accent-red rounded-lg p-4 flex items-center gap-3 bg-accent-red/5 hover:bg-accent-red/10 transition-colors text-left"
          >
            <Crown size={20} className="text-accent-red flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[#F5F5F5] text-sm font-heading font-bold">Upgrade to Premium →</p>
              <p className="text-[#888888] text-xs mt-0.5">Unlock all features from 4.99€/mo</p>
            </div>
            <ChevronRight size={16} className="text-[#444444]" />
          </button>
        )}
      </div>

      {/* ── ABOUT ── */}
      <SectionHeader label="About" />
      <div className="border-t border-[#1A1A1A]">
        <SettingsRow
          icon={<Info size={16} />}
          label="Version"
          value="1.0.0"
          showChevron={false}
        />
        <SettingsRow
          icon={<ExternalLink size={16} />}
          label="Privacy Policy"
          onClick={() => window.open('https://lyfe.app/privacy', '_blank')}
        />
        <SettingsRow
          icon={<Shield size={16} />}
          label="Terms of Service"
          onClick={() => window.open('https://lyfe.app/terms', '_blank')}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-6 text-center">
        <p className="text-[#444444] text-[10px] font-body">
          LYFE v1.0.0 — Track everything. Understand yourself.
        </p>
      </div>
    </div>
  )
}
