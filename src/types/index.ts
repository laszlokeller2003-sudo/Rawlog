// ─── Category Types ───────────────────────────────────────────────────────────

export type CategoryId =
  | 'substances'
  | 'intimacy'
  | 'fitness'
  | 'sleep'
  | 'mood'
  | 'nutrition'
  | 'finance'
  | 'social'
  | 'work'
  | 'health'

export interface Category {
  id: CategoryId
  name: string
  nameDE?: string
  icon: string
  color: string
  appLabel?: string // App Store friendly label
  subcategories: string[]
  enabled: boolean
  order: number
}

// ─── Entry Fields (per category) ────────────────────────────────────────────

export interface SubstanceFields {
  // Legacy / generic fields
  quantity?: number
  unit?: 'pieces' | 'ml' | 'mg' | string
  moodBefore?: number
  moodAfter?: number

  // Joint / Blüten
  count?: number
  size?: 'Klein' | 'Mittel' | 'Groß' | 'XL'
  content?: 'Nur Gras' | 'Mix' | 'Nur Tabak'
  grams?: number
  strain?: string
  with?: string[]
  method?: 'Bong' | 'Vape' | 'Pfeife' | 'Edible'

  // Zigarette
  brand?: string
  selfRolled?: boolean

  // Alkohol
  alcoholType?: 'Bier' | 'Wein' | 'Spirits' | 'Cocktail' | 'Shot' | 'Sekt'
  ml?: number
  percentage?: number
  standardDrinks?: number

  // Kaffee / Energy Drink
  coffeeType?: 'Espresso' | 'Filter' | 'Cappuccino' | 'Latte' | 'Cold Brew'
  caffeineMg?: number

  // Medikament
  name?: string
  dose?: number
  prescribed?: boolean
  timing?: string
}

export interface IntimacyFields {
  partner?: string
  location?: string
  rating?: number
  duration?: number // minutes
  protection?: boolean
}

export interface FitnessFields {
  duration?: number // minutes
  intensity?: number
  distance?: number // km
  caloriesBurned?: number
}

export interface SleepFields {
  duration?: number // minutes total
  quality?: number
  dreams?: boolean
}

export interface MoodFields {
  intensity?: number
  emoji?: string
  triggers?: MoodTrigger[]
}

export type MoodTrigger =
  | 'work'
  | 'relationships'
  | 'health'
  | 'money'
  | 'sleep'
  | 'substances'
  | 'weather'
  | 'other'

export interface NutritionFields {
  mealName?: string
  size?: 'Snack' | 'Klein' | 'Normal' | 'Groß' | 'Cheat'
  quality?: number // healthy gauge
  water?: number // ml
  fastFood?: boolean
  calories?: number
}

export interface FinanceFields {
  amount: number
  currency: Currency
  categoryTag?: FinanceCategoryTag
  paymentMethod?: 'cash' | 'card' | 'transfer'
  recurring?: boolean
}

export type FinanceCategoryTag =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'clothing'
  | 'tech'
  | 'other'

export interface SocialFields {
  who?: string
  energyAfter?: 'drained' | 'neutral' | 'energized'
  quality?: number
}

export interface WorkFields {
  duration?: number // minutes
  focusScore?: number
  tasksCompleted?: number
}

export interface HealthFields {
  symptom?: string
  severity?: number
  bodyPart?: string
  medication?: string
  energy?: number
}

export type EntryFields =
  | SubstanceFields
  | IntimacyFields
  | FitnessFields
  | SleepFields
  | MoodFields
  | NutritionFields
  | FinanceFields
  | SocialFields
  | WorkFields
  | HealthFields

// ─── Entry ───────────────────────────────────────────────────────────────────

export interface Entry {
  id: string
  category: CategoryId
  subcategory: string
  fields: EntryFields
  note?: string
  timestamp: string // ISO UTC string
  tags?: string[]
  templateId?: string
  synced?: boolean
}

// ─── Habit ───────────────────────────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly' | number[] // number[] = days of week 0-6

export interface Habit {
  id: string
  name: string
  category: CategoryId
  frequency: HabitFrequency
  currentStreak: number
  longestStreak: number
  graceperiod: boolean
  createdAt: string
  enabled: boolean
  color?: string
}

export interface HabitLog {
  id: string
  habitId: string
  date: string // YYYY-MM-DD
  completed: boolean
}

// ─── Goal ─────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string
  title: string
  category: CategoryId
  targetValue: number
  currentValue: number
  unit: string
  deadline?: string // ISO date string
  createdAt: string
  achieved: boolean
  achievedAt?: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  streaming?: boolean
}

// ─── Insight ─────────────────────────────────────────────────────────────────

export type InsightTag = 'warning' | 'positive' | 'tip' | 'pattern'

export interface Insight {
  id: string
  emoji: string
  title: string
  body: string
  tag: InsightTag
  generatedAt: string
}

// ─── Body Metrics ────────────────────────────────────────────────────────────

export interface BodyMetric {
  id: string
  date: string // YYYY-MM-DD
  weight?: number // kg
  bodyFat?: number // %
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
    arms?: number
  }
}

// ─── Profile & Settings ─────────────────────────────────────────────────────

export type Language = 'en' | 'de'
export type Currency = 'EUR' | 'USD' | 'GBP'
export type BiologicalSex = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export interface UserGoal {
  id: string
  label: string
  selected: boolean
}

export type ReminderFrequency = 'none' | 'daily' | 'custom'

export interface UserProfile {
  name: string
  dateOfBirth?: string // YYYY-MM-DD
  biologicalSex?: BiologicalSex
  language: Language
  currency: Currency
  photoUrl?: string // local data URL
  selectedCategories: CategoryId[]
  goals: string[]
  reminderFrequency: ReminderFrequency
  reminderTime?: string // HH:MM
  cloudSyncEnabled: boolean
  appLockEnabled: boolean
  appLockPin?: string
  isPremium: boolean
  trialStartedAt?: string
  onboardingComplete: boolean
  dailyReportEnabled: boolean
  dailyReportTime: string // HH:MM default "21:00"
  weeklyReportEnabled: boolean
  monthlyReportEnabled: boolean
  scoreWeights?: Record<string, number>
  // Life Score goal
  scoreGoal: number // default 75, range 50-100
  // Body metrics
  weightKg?: number
  heightCm?: number
  // Finance
  dailyBudget?: number
  // Nutrition goals
  calorieGoal?: number
  proteinGoalG?: number
  waterGoalMl?: number
  nutritionGoalType?: 'lose' | 'maintain' | 'gain'
  // Fitness personal goals (for gauge %)
  fitnessIntensityGoal?: number // default 7
  sleepQualityGoal?: number     // default 8
  workFocusGoal?: number        // default 8
  moodGoal?: number             // default 7
}

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  categories: Category[]
  currency: Currency
  language: Language
}

// ─── Entry Template ──────────────────────────────────────────────────────────

export interface EntryTemplate {
  id: string
  name: string
  category: CategoryId
  subcategory: string
  fields: EntryFields
  note?: string
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export type TimeFilter = 'today' | 'week' | 'month' | '3months' | 'year' | 'all'

export interface DayStat {
  date: string // YYYY-MM-DD
  count: number
}

export interface CategoryStat {
  category: CategoryId
  count: number
  percentage: number
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type TabId = 'home' | 'log' | 'stats' | 'dashboards' | 'insights' | 'profile'

// ─── Supabase Auth ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
}

// ─── Paywall ──────────────────────────────────────────────────────────────────

export type PremiumFeature =
  | 'full_stats'
  | 'dashboards'
  | 'unlimited_habits'
  | 'unlimited_goals'
  | 'ki_chat'
  | 'ki_insights'
  | 'cloud_sync'
  | 'export'
  | 'app_lock'

export const PREMIUM_FEATURES: Record<PremiumFeature, string> = {
  full_stats: 'Full stats history',
  dashboards: 'All 4 specialized dashboards',
  unlimited_habits: 'Unlimited habits',
  unlimited_goals: 'Unlimited goals',
  ki_chat: 'AI PA Chat (unlimited)',
  ki_insights: 'AI Insights & auto reports',
  cloud_sync: 'Cloud sync across devices',
  export: 'Data export (JSON + CSV)',
  app_lock: 'App lock (PIN)',
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  tag?: string
}
