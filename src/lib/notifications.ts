/**
 * RAWLOG — Notifications Service
 * Handles Web Push permission, scheduled daily/weekly reports,
 * habit reminders, and in-app toasts.
 */

import type { NotificationPayload } from '@/types'

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function getPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission as 'granted' | 'denied' | 'default'
}

// ─── Show notification ────────────────────────────────────────────────────────

export function showNotification(payload: NotificationPayload): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    // Prefer service worker notification (supports actions, badges)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon ?? '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: payload.tag ?? 'rawlog',
          data: payload,
          silent: false,
        })
      }).catch(() => {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon ?? '/pwa-192x192.png',
          tag: payload.tag,
        })
      })
    } else {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon ?? '/pwa-192x192.png',
        tag: payload.tag,
      })
    }
  } catch {
    // Silently fail (notification blocked)
  }
}

// ─── Schedule notification at specific time ───────────────────────────────────

const scheduledTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

export function scheduleNotification(payload: NotificationPayload, delayMs: number): void {
  const key = payload.tag ?? `notif-${Date.now()}`
  const existing = scheduledTimers.get(key)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => showNotification(payload), delayMs)
  scheduledTimers.set(key, timer)
}

export function cancelScheduledNotification(tag: string): void {
  const timer = scheduledTimers.get(tag)
  if (timer) {
    clearTimeout(timer)
    scheduledTimers.delete(tag)
  }
}

// ─── Schedule daily report ────────────────────────────────────────────────────

export function scheduleDailyReport(timeString: string, entriesCount: number): void {
  if (getPermissionState() !== 'granted') return

  const [hours, minutes] = timeString.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)

  // If time already passed today, schedule for tomorrow
  if (target <= now) target.setDate(target.getDate() + 1)
  const delay = target.getTime() - now.getTime()

  scheduleNotification(
    {
      title: 'RAWLOG Daily Report',
      body: entriesCount > 0
        ? `You logged ${entriesCount} entries today. Tap to see your daily analysis.`
        : 'No entries today yet. Take 2 minutes to log your day.',
      tag: 'daily-report',
      icon: '/pwa-192x192.png',
    },
    delay
  )
}

// ─── Schedule weekly report ───────────────────────────────────────────────────

export function scheduleWeeklyReport(entriesCount: number): void {
  if (getPermissionState() !== 'granted') return

  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7
  const target = new Date()
  target.setDate(now.getDate() + daysUntilSunday)
  target.setHours(20, 0, 0, 0) // Sunday 8pm
  const delay = target.getTime() - now.getTime()

  scheduleNotification(
    {
      title: 'RAWLOG Weekly Summary',
      body: `${entriesCount} entries this week. Your PA has a new analysis ready.`,
      tag: 'weekly-report',
      icon: '/pwa-192x192.png',
    },
    delay
  )
}

// ─── Habit reminder ───────────────────────────────────────────────────────────

export function scheduleHabitReminder(habitName: string, delayMs: number = 0): void {
  if (getPermissionState() !== 'granted') return
  const delay = delayMs > 0 ? delayMs : getDelayToTime(21, 0) // default 9pm

  scheduleNotification(
    {
      title: '⚡ Habit Reminder',
      body: `Don't break your streak: ${habitName}`,
      tag: `habit-${habitName.toLowerCase().replace(/\s/g, '-')}`,
      icon: '/pwa-192x192.png',
    },
    delay
  )
}

// ─── Log reminder ─────────────────────────────────────────────────────────────

export function scheduleLogReminder(): void {
  if (getPermissionState() !== 'granted') return
  const delay = getDelayToTime(22, 0) // 10pm

  scheduleNotification(
    {
      title: '📋 Log Today',
      body: "You haven't logged anything today. 2 minutes keeps the streak alive.",
      tag: 'log-reminder',
      icon: '/pwa-192x192.png',
    },
    delay
  )
}

// ─── Helper: ms until hh:mm today (tomorrow if past) ────────────────────────

function getDelayToTime(hours: number, minutes: number): number {
  const now = new Date()
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

// ─── Init from profile settings ──────────────────────────────────────────────

export function initNotificationsFromProfile(
  profile: {
    dailyReportEnabled: boolean
    dailyReportTime: string
    weeklyReportEnabled: boolean
    reminderFrequency: string
  },
  entriesCount: number
): void {
  if (getPermissionState() !== 'granted') return

  if (profile.dailyReportEnabled) {
    scheduleDailyReport(profile.dailyReportTime ?? '21:00', entriesCount)
  } else {
    cancelScheduledNotification('daily-report')
  }

  if (profile.weeklyReportEnabled) {
    scheduleWeeklyReport(entriesCount)
  } else {
    cancelScheduledNotification('weekly-report')
  }
}
