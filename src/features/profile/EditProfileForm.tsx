import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfileStore } from '@/stores/useProfileStore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { BiologicalSex, Language, Currency } from '@/types'

interface EditProfileFormProps {
  onClose: () => void
}

interface PillOption<T extends string> {
  value: T
  label: string
}

function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: PillOption<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-heading rounded-md border transition-colors',
            value === opt.value
              ? 'bg-accent-red border-accent-red text-white'
              : 'bg-transparent border-border text-[#888888] hover:border-[#444444]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const LANGUAGE_OPTIONS: PillOption<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
]

const CURRENCY_OPTIONS: PillOption<Currency>[] = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
]

export function EditProfileForm({ onClose }: EditProfileFormProps) {
  const { t } = useTranslation()
  const { profile, updateProfile } = useProfileStore()

  const SEX_OPTIONS: PillOption<BiologicalSex>[] = [
    { value: 'male', label: t('onboarding.profile.sexMale') },
    { value: 'female', label: t('onboarding.profile.sexFemale') },
    { value: 'other', label: t('onboarding.profile.sexOther') },
    { value: 'prefer_not_to_say', label: t('onboarding.profile.sexPrefer') },
  ]
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile.name)
  const [dob, setDob] = useState(profile.dateOfBirth ?? '')
  const [sex, setSex] = useState<BiologicalSex>(profile.biologicalSex ?? 'prefer_not_to_say')
  const [language, setLanguage] = useState<Language>(profile.language)
  const [currency, setCurrency] = useState<Currency>(profile.currency)
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '')
  const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncome?.toString() ?? '')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        setPhotoUrl(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t('profile.nameRequiredError'))
      return
    }
    updateProfile({
      name: name.trim(),
      dateOfBirth: dob || undefined,
      biologicalSex: sex,
      language,
      currency,
      photoUrl: photoUrl || undefined,
      monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
    })
    toast.success(t('profile.profileSavedToast'))
    onClose()
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border group"
          aria-label={t('profile.changePhotoAria')}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent-red flex items-center justify-center text-white font-heading font-bold text-2xl">
              {initials || '?'}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <p className="text-[#444444] text-xs">{t('profile.changePhoto')}</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-[#888888] text-xs font-heading uppercase tracking-wider">
          {t('profile.fullName')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('profile.namePlaceholder')}
          className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-[#F5F5F5] text-sm placeholder:text-[#444444] focus:outline-none focus:border-accent-red focus:shadow-red-glow transition-all"
        />
      </div>

      {/* DOB */}
      <div className="space-y-1.5">
        <label className="text-[#888888] text-xs font-heading uppercase tracking-wider">
          {t('profile.dateOfBirth')}
        </label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-[#F5F5F5] text-sm focus:outline-none focus:border-accent-red focus:shadow-red-glow transition-all [color-scheme:dark]"
        />
      </div>

      {/* Biological Sex */}
      <div className="space-y-2">
        <label className="text-[#888888] text-xs font-heading uppercase tracking-wider">
          {t('onboarding.profile.sex')}
        </label>
        <PillSelector<BiologicalSex>
          options={SEX_OPTIONS}
          value={sex}
          onChange={setSex}
        />
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-[#888888] text-xs font-heading uppercase tracking-wider">
          {t('profile.language')}
        </label>
        <PillSelector<Language>
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={setLanguage}
        />
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <label className="text-[#888888] text-xs font-heading uppercase tracking-wider">
          {t('profile.currency')}
        </label>
        <PillSelector<Currency>
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={setCurrency}
        />
      </div>

      {/* Monthly Income */}
      <div className="space-y-1.5">
        <label className="text-[#888888] text-xs font-heading uppercase tracking-wider">
          {t('profile.monthlyIncome')} <span style={{ color: '#444444' }}>({t('common.optional')})</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#888888', fontFamily: 'system-ui, sans-serif' }}>
            {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder={t('profile.monthlyIncomePlaceholder')}
            className="w-full bg-bg-elevated border border-border rounded-lg pl-8 pr-3 py-2.5 text-[#F5F5F5] text-sm placeholder:text-[#444444] focus:outline-none focus:border-accent-red focus:shadow-red-glow transition-all"
          />
        </div>
      </div>

      {/* Save button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        className="w-full bg-accent-red text-white font-heading font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
      >
        <Save size={16} />
        {t('profile.saveProfile')}
      </motion.button>
    </div>
  )
}
