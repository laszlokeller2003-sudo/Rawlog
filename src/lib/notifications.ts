import type { NotificationPayload } from '@/types'

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showNotification(payload: NotificationPayload): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/pwa-192x192.png',
      tag: payload.tag,
    })
  } catch {
    // Notification may fail in some environments (e.g. service worker not registered)
  }
}

export function scheduleNotification(payload: NotificationPayload, delayMs: number): void {
  setTimeout(() => showNotification(payload), delayMs)
}
