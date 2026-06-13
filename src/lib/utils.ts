import { type ClassValue, clsx } from 'clsx'

// Simple cn utility without clsx dependency — use string concatenation
export function cn(...classes: (string | undefined | null | false | ClassValue)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format duration from minutes
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID()
}

// Get today's date as YYYY-MM-DD
export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

// Parse date string to Date
export function fromDateString(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

// Check if date string is today
export function isToday(dateStr: string): boolean {
  return toDateString() === dateStr
}

// Check if date string is in this week (Mon-Sun)
export function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)
  return date >= weekStart
}

// Truncate string
export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Calculate age from DOB string (YYYY-MM-DD)
export function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Get greeting based on time
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

// Clamp number between min and max
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

// Group array by key
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

// Average of number array
export function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// Debounce
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// Is premium trial still active (7 days)
export function isTrialActive(trialStartedAt?: string): boolean {
  if (!trialStartedAt) return false
  const start = new Date(trialStartedAt)
  const now = new Date()
  const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays < 7
}

// Has premium access (either paid or in trial)
export function isPremiumOrTrial(isPremium: boolean, trialStartedAt?: string): boolean {
  return isPremium || isTrialActive(trialStartedAt)
}

// Gate helper — returns true if action should be allowed
export function canAccess(
  feature: string,
  isPremium: boolean,
  trialStartedAt?: string
): boolean {
  const FREE_FEATURES = ['basic_log', 'mood', 'substances', 'fitness', 'sleep', 'nutrition', 'social', 'work', 'health', 'intimacy', 'finance_basic']
  if (FREE_FEATURES.includes(feature)) return true
  return isPremiumOrTrial(isPremium, trialStartedAt)
}
