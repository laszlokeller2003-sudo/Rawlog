// Haptic feedback utility using the Vibration API
// Falls back silently if not supported

export function hapticLight(): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  } catch {
    // Silently fail
  }
}

export function hapticMedium(): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(25)
    }
  } catch {
    // Silently fail
  }
}

export function hapticSuccess(): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 20])
    }
  } catch {
    // Silently fail
  }
}

export function hapticError(): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50])
    }
  } catch {
    // Silently fail
  }
}

export function hapticSelection(): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(8)
    }
  } catch {
    // Silently fail
  }
}

export function hapticTap(): void {
  hapticLight()
}
