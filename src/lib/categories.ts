import type { Category, CategoryId } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'substances',
    name: 'Substances',
    nameDE: 'Substanzen',
    icon: '🌿',
    color: '#A855F7',
    subcategories: ['Joint', 'Blüten', 'Zigarette', 'Alkohol', 'Kaffee', 'Energy Drink', 'Medikament', 'Other'],
    enabled: true,
    order: 0,
  },
  {
    id: 'intimacy',
    name: 'Intimacy & Relationships',
    nameDE: 'Intimität & Beziehungen',
    icon: '❤️',
    color: '#FF2020',
    appLabel: 'Intimacy',
    subcategories: ['Sex', 'Masturbation', 'Kiss', 'Date', 'Flirt', 'Cuddling', 'Other'],
    enabled: true,
    order: 1,
  },
  {
    id: 'fitness',
    name: 'Fitness',
    nameDE: 'Fitness',
    icon: '🏋️',
    color: '#22C55E',
    subcategories: ['Gym', 'Laufen', 'Radfahren', 'Schwimmen', 'Gehen', 'Yoga', 'HIIT', 'Sport', 'Stretching', 'Other'],
    enabled: true,
    order: 2,
  },
  {
    id: 'sleep',
    name: 'Sleep',
    nameDE: 'Schlaf',
    icon: '😴',
    color: '#3B82F6',
    subcategories: ['Schlaf', 'Nickerchen'],
    enabled: true,
    order: 3,
  },
  {
    id: 'mood',
    name: 'Mood',
    nameDE: 'Stimmung',
    icon: '🧠',
    color: '#EAB308',
    subcategories: ['Happy', 'Sad', 'Stressed', 'Relaxed', 'Angry', 'Motivated', 'Tired', 'Anxious', 'Euphoric', 'Depressed', 'Neutral', 'Grateful', 'Frustrated', 'Lonely', 'Excited', 'Calm'],
    enabled: true,
    order: 4,
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    nameDE: 'Ernährung',
    icon: '🍽️',
    color: '#F97316',
    subcategories: ['Mahlzeit', 'Wasser', 'Supplement', 'Fasten'],
    enabled: true,
    order: 5,
  },
  {
    id: 'finance',
    name: 'Money & Finance',
    nameDE: 'Geld & Ausgaben',
    icon: '💰',
    color: '#22C55E',
    subcategories: ['Ausgabe', 'Einnahme', 'Sparen', 'Investition', 'Schulden'],
    enabled: true,
    order: 6,
  },
  {
    id: 'social',
    name: 'Social Life',
    nameDE: 'Soziales Leben',
    icon: '👥',
    color: '#06B6D4',
    subcategories: ['Freunde', 'Familie', 'Partner', 'Party', 'Event', 'Networking', 'Allein', 'Online'],
    enabled: true,
    order: 7,
  },
  {
    id: 'work',
    name: 'Work & Productivity',
    nameDE: 'Arbeit & Produktivität',
    icon: '⚡',
    color: '#6366F1',
    subcategories: ['Deep Work', 'Meeting', 'Planung', 'Prokrastiniert', 'Flow State', 'Überstunden', 'Pause'],
    enabled: true,
    order: 8,
  },
  {
    id: 'health',
    name: 'Health',
    nameDE: 'Gesundheit',
    icon: '🏥',
    color: '#EC4899',
    subcategories: ['Medikament', 'Arzt', 'Krank', 'Symptom', 'Messung', 'Supplement', 'Energie'],
    enabled: true,
    order: 9,
  },
]

export function getCategoryById(id: CategoryId, categories: Category[] = DEFAULT_CATEGORIES): Category {
  return categories.find((c) => c.id === id) ?? DEFAULT_CATEGORIES[0]
}

export function getCategoryName(cat: Category, language: string): string {
  if (language === 'de' && (cat as any).nameDE) return (cat as any).nameDE
  return cat.name
}
