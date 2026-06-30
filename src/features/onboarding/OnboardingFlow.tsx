import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Camera, Check, Cloud } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { signUpWithEmail, signInWithEmail } from '@/lib/sync'
import toast from 'react-hot-toast'
import type { CategoryId, Language, BiologicalSex, ReminderFrequency } from '@/types'

// ─── Animation Variants ───────────────────────────────────────────────────────

const slideVariants: Variants = {
  enter: { x: 30, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { x: -30, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
  center: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  center: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 6,
            backgroundColor: i === current ? '#FF2020' : '#242424',
          }}
          transition={{ duration: 0.2 }}
          style={{ height: 6, borderRadius: 3 }}
        />
      ))}
    </div>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-4 border-b border-[#1A1A1A]"
    >
      <span className="text-sm text-[#F5F5F5] font-medium">{label}</span>
      <div
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-[#FF2020]' : 'bg-[#242424]'
        )}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white"
        />
      </div>
    </button>
  )
}

// ─── Screen 1: Welcome ────────────────────────────────────────────────────────

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col min-h-full bg-[#080808]">
      {/* Spacer top */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: 64,
                letterSpacing: '-0.04em',
                color: '#F5F5F5',
                lineHeight: 1,
                display: 'block',
              }}
            >
              {t('onboarding.welcome.title')}
            </span>
          </motion.div>

          {/* Red accent line */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ width: 32, height: 3, background: '#FF2020', borderRadius: 2 }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: '#888888',
              letterSpacing: '0.01em',
            }}
          >
            {t('onboarding.welcome.tagline')}
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: '#444444',
              lineHeight: 1.6,
              maxWidth: 300,
            }}
          >
            {t('onboarding.welcome.subtitle')}
          </motion.p>
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="px-6 pb-12"
      >
        <button type="button" className="btn-primary" onClick={onNext}>
          {t('onboarding.welcome.cta')}
        </button>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#444444',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          {t('onboarding.welcome.noaccount')}
        </p>
      </motion.div>
    </div>
  )
}

// ─── Screen 2: Profile Setup ──────────────────────────────────────────────────

interface ProfileData {
  name: string
  dateOfBirth: string
  biologicalSex: BiologicalSex | ''
  language: Language
  photoUrl: string
  monthlyIncome?: number
}

function ProfileScreen({
  onNext,
  onBack,
}: {
  onNext: (data: ProfileData) => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useProfileStore()

  const [name, setName] = useState(profile.name)
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ?? '')
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | ''>(profile.biologicalSex ?? '')
  const [language, setLanguage] = useState<Language>(profile.language)
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '')
  const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncome?.toString() ?? '')

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setPhotoUrl(ev.target.result)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const sexOptions: { value: BiologicalSex; label: string }[] = [
    { value: 'male', label: t('onboarding.profile.sexMale') },
    { value: 'female', label: t('onboarding.profile.sexFemale') },
    { value: 'other', label: t('onboarding.profile.sexOther') },
    { value: 'prefer_not_to_say', label: t('onboarding.profile.sexPrefer') },
  ]

  const langOptions: { value: Language; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'de', label: 'DE' },
  ]

  return (
    <div className="flex flex-col min-h-full bg-[#080808]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button type="button" className="btn-ghost p-2" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700 }}
          >
            {t('onboarding.profile.title')}
          </h2>
          <p style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>
            {t('onboarding.profile.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Photo */}
        <div className="flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#242424] bg-[#181818] flex items-center justify-center"
            style={{ transition: 'border-color 150ms' }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} color="#444444" />
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera size={20} color="white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p style={{ fontSize: 11, color: '#444444', marginTop: 8 }}>
            {t('onboarding.profile.photo')}
          </p>
        </div>

        {/* Name */}
        <div className="mb-5">
          <label className="input-label">{t('onboarding.profile.name')}</label>
          <input
            type="text"
            className="input-field"
            placeholder={t('onboarding.profile.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        {/* Date of Birth */}
        <div className="mb-5">
          <label className="input-label">{t('onboarding.profile.dob')}</label>
          <input
            type="date"
            className="input-field"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Biological Sex */}
        <div className="mb-5">
          <label className="input-label">{t('onboarding.profile.sex')}</label>
          <div className="flex flex-wrap gap-2">
            {sexOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBiologicalSex(opt.value)}
                className={cn('pill', biologicalSex === opt.value && 'active')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="mb-5">
          <label className="input-label">{t('onboarding.profile.language')}</label>
          <div className="flex gap-2">
            {langOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLanguage(opt.value)}
                className={cn('pill', language === opt.value && 'active')}
                style={{ minWidth: 56 }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Income */}
        <div className="mb-8">
          <label className="input-label">{t('profile.monthlyIncome')}</label>
          <input
            type="number"
            min="0"
            step="1"
            className="input-field"
            placeholder={t('profile.monthlyIncomePlaceholder')}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <button
          type="button"
          className="btn-primary"
          disabled={!name.trim()}
          onClick={() =>
            onNext({ name, dateOfBirth, biologicalSex, language, photoUrl, monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : undefined })
          }
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}

// ─── Screen 3: Lifestyle ──────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  'goalBetterSleep',
  'goalMoreFitness',
  'goalQuitSmoking',
  'goalSaveMoney',
  'goalImproveRelationships',
  'goalReduceStress',
  'goalEatHealthier',
  'goalMoreProductivity',
] as const

interface LifestyleData {
  selectedCategories: CategoryId[]
  goals: string[]
  reminderFrequency: ReminderFrequency
  reminderTime: string
}

function LifestyleScreen({
  onNext,
  onBack,
  initialData,
}: {
  onNext: (data: LifestyleData) => void
  onBack: () => void
  initialData: LifestyleData
}) {
  const { t } = useTranslation()
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    initialData.selectedCategories
  )
  const [goals, setGoals] = useState<string[]>(initialData.goals)
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>(
    initialData.reminderFrequency
  )
  const [reminderTime, setReminderTime] = useState(initialData.reminderTime)

  const toggleCategory = (id: CategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleGoal = (goal: string) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  const reminderOptions: { value: ReminderFrequency; label: string }[] = [
    { value: 'none', label: t('onboarding.lifestyle.reminderNone') },
    { value: 'daily', label: t('onboarding.lifestyle.reminderDaily') },
    { value: 'custom', label: t('onboarding.lifestyle.reminderCustom') },
  ]

  return (
    <div className="flex flex-col min-h-full bg-[#080808]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button type="button" className="btn-ghost p-2" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700 }}>
            {t('onboarding.lifestyle.title')}
          </h2>
          <p style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>
            {t('onboarding.lifestyle.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Categories */}
        <div className="mb-7">
          <p className="section-title mb-3">{t('onboarding.lifestyle.categories')}</p>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="relative flex items-center gap-3 p-3 rounded-lg border transition-all"
                  style={{
                    background: isSelected ? `${cat.color}15` : '#1C1C1C',
                    borderColor: isSelected ? cat.color : '#242424',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{cat.icon}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isSelected ? '#F5F5F5' : '#888888',
                      fontFamily: "'Space Grotesk', sans-serif",
                      textAlign: 'left',
                      lineHeight: 1.2,
                    }}
                  >
                    {cat.name}
                  </span>
                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: cat.color }}
                    >
                      <Check size={10} color="white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Goals */}
        <div className="mb-7">
          <p className="section-title mb-3">{t('onboarding.lifestyle.goals')}</p>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((goalKey) => {
              const label = t(`onboarding.lifestyle.${goalKey}`)
              const isSelected = goals.includes(goalKey)
              return (
                <button
                  key={goalKey}
                  type="button"
                  onClick={() => toggleGoal(goalKey)}
                  className={cn('pill', isSelected && 'active')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Reminders */}
        <div className="mb-6">
          <p className="section-title mb-3">{t('onboarding.lifestyle.reminders')}</p>
          <div className="flex gap-2 mb-3">
            {reminderOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReminderFrequency(opt.value)}
                className={cn('pill', reminderFrequency === opt.value && 'active')}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {reminderFrequency === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className="input-label">{t('onboarding.lifestyle.reminderTime')}</label>
              <input
                type="time"
                className="input-field"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <button
          type="button"
          className="btn-primary"
          onClick={() => onNext({ selectedCategories, goals, reminderFrequency, reminderTime })}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}

// ─── Screen 4: Privacy ────────────────────────────────────────────────────────

interface PrivacyData {
  cloudSyncEnabled: boolean
  email: string
  password: string
}

function PrivacyScreen({
  onNext,
  onBack,
}: {
  onNext: (data: PrivacyData) => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="flex flex-col min-h-full bg-[#080808]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button type="button" className="btn-ghost p-2" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        {/* Cloud icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mb-6"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <Cloud size={28} color="#3B82F6" />
          </div>
        </motion.div>

        <div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {t('onboarding.privacy.title')}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-6"
          >
            {t('onboarding.privacy.body')
              .split('\n\n')
              .map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 14,
                    color: '#888888',
                    lineHeight: 1.65,
                    marginBottom: i === 0 ? 12 : 0,
                  }}
                >
                  {para}
                </p>
              ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mb-2"
          >
            <div className="card-surface">
              <ToggleSwitch
                checked={cloudSyncEnabled}
                onChange={setCloudSyncEnabled}
                label={t('onboarding.privacy.toggleLabel')}
              />

              <AnimatePresence>
                {cloudSyncEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4"
                  >
                    <div className="mb-4">
                      <label className="input-label">{t('onboarding.privacy.email')}</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder={t('onboarding.privacy.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label className="input-label">{t('onboarding.privacy.password')}</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder={t('onboarding.privacy.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <button
          type="button"
          className="btn-primary"
          onClick={() => onNext({ cloudSyncEnabled, email, password })}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}

// ─── Screen 5: Ready ──────────────────────────────────────────────────────────

function ReadyScreen({
  selectedCategories,
  onStart,
}: {
  selectedCategories: CategoryId[]
  onStart: () => void
}) {
  const { t } = useTranslation()

  const previewCats = DEFAULT_CATEGORIES.filter((c) => selectedCategories.includes(c.id)).slice(0, 3)

  return (
    <div className="flex flex-col min-h-full bg-[#080808]">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Animated checkmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              {/* Circle */}
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                stroke="#22C55E"
                strokeWidth="3"
                fill="rgba(34,197,94,0.08)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              {/* Checkmark path */}
              <motion.path
                d="M24 40 L35 52 L56 28"
                stroke="#22C55E"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {t('onboarding.ready.title')}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{ fontSize: 14, color: '#888888', lineHeight: 1.6, maxWidth: 280 }}
          >
            {t('onboarding.ready.subtitle')}
          </motion.p>

          {/* Category chips */}
          {previewCats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="flex gap-2 flex-wrap justify-center"
            >
              {previewCats.map((cat) => (
                <div
                  key={cat.id}
                  className="pill"
                  style={{
                    background: `${cat.color}18`,
                    borderColor: `${cat.color}50`,
                    color: cat.color,
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="px-6 pb-12"
      >
        <button type="button" className="btn-primary" onClick={onStart}>
          {t('onboarding.ready.cta')}
        </button>
      </motion.div>
    </div>
  )
}

// ─── Main Onboarding Flow ─────────────────────────────────────────────────────

export function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const { profile, updateProfile, completeOnboarding } = useProfileStore()

  // Collected data across screens
  const [profileData, setProfileData] = useState<ProfileData>({
    name: profile.name,
    dateOfBirth: profile.dateOfBirth ?? '',
    biologicalSex: profile.biologicalSex ?? '',
    language: profile.language,
    photoUrl: profile.photoUrl ?? '',
  })

  const [lifestyleData, setLifestyleData] = useState<LifestyleData>({
    selectedCategories: profile.selectedCategories,
    goals: profile.goals,
    reminderFrequency: profile.reminderFrequency,
    reminderTime: profile.reminderTime ?? '08:00',
  })

  const goNext = useCallback(() => {
    setDirection(1)
    setStep((s) => s + 1)
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setStep((s) => s - 1)
  }, [])

  const handleProfileNext = useCallback(
    (data: ProfileData) => {
      setProfileData(data)
      updateProfile({
        name: data.name,
        dateOfBirth: data.dateOfBirth || undefined,
        biologicalSex: data.biologicalSex || undefined,
        language: data.language,
        photoUrl: data.photoUrl || undefined,
        monthlyIncome: data.monthlyIncome,
      })
      goNext()
    },
    [updateProfile, goNext]
  )

  const handleLifestyleNext = useCallback(
    (data: LifestyleData) => {
      setLifestyleData(data)
      updateProfile({
        selectedCategories: data.selectedCategories,
        goals: data.goals,
        reminderFrequency: data.reminderFrequency,
        reminderTime: data.reminderFrequency === 'custom' ? data.reminderTime : undefined,
      })
      goNext()
    },
    [updateProfile, goNext]
  )

  const handlePrivacyNext = useCallback(
    async (data: PrivacyData) => {
      updateProfile({ cloudSyncEnabled: data.cloudSyncEnabled })
      if (data.cloudSyncEnabled && data.email && data.password) {
        try {
          await signUpWithEmail(data.email, data.password, profileData.name)
            .catch(() => signInWithEmail(data.email, data.password))
          toast.success('Account created & syncing!')
        } catch {
          toast.error('Could not create account — continuing offline')
        }
      }
      goNext()
    },
    [updateProfile, goNext, profileData.name]
  )

  const handleStart = useCallback(() => {
    completeOnboarding()
  }, [completeOnboarding])

  const screens = [
    <WelcomeScreen key="welcome" onNext={goNext} />,
    <ProfileScreen
      key="profile"
      onNext={handleProfileNext}
      onBack={goBack}
    />,
    <LifestyleScreen
      key="lifestyle"
      onNext={handleLifestyleNext}
      onBack={goBack}
      initialData={lifestyleData}
    />,
    <PrivacyScreen key="privacy" onNext={handlePrivacyNext} onBack={goBack} />,
    <ReadyScreen
      key="ready"
      selectedCategories={lifestyleData.selectedCategories}
      onStart={handleStart}
    />,
  ]

  const customVariants = {
    enter: { x: direction * 30, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
    exit: {
      x: direction * -30,
      opacity: 0,
      transition: { duration: 0.15, ease: 'easeIn' as const },
    },
  }

  return (
    <div className="app-container" style={{ background: '#080808' }}>
      {/* Progress dots (hidden on welcome screen) */}
      {step > 0 && (
        <div className="pt-safe px-6 pt-4 pb-2">
          <ProgressDots total={5} current={step} />
        </div>
      )}

      {/* Screens */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={customVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 overflow-y-auto"
          >
            {screens[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default OnboardingFlow
