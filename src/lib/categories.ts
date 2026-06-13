import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Category, CategoryId } from '@/types'
import { generateId } from '@/lib/utils'

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'substances',
    name: 'Substances',
    icon: '🌿',
    color: '#A855F7',
    subcategories: ['Joint', 'Cigarette', 'Alcohol', 'Coffee', 'Energy Drink', 'Medication', 'Other'],
    enabled: true,
    order: 0,
  },
  {
    id: 'intimacy',
    name: 'Intimacy & Relationships',
    icon: '❤️',
    color: '#FF2020',
    appLabel: 'Intimacy & Relationships',
    subcategories: ['Sex', 'Masturbation', 'Kiss', 'Date', 'Flirt', 'Cuddling', 'Other'],
    enabled: true,
    order: 1,
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: '💪',
    color: '#22C55E',
    subcategories: ['Gym', 'Running', 'Cycling', 'Swimming', 'Yoga', 'HIIT', 'Sports', 'Walk', 'Stretching', 'Other'],
    enabled: true,
    order: 2,
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: '😴',
    color: '#3B82F6',
    subcategories: ['Bedtime', 'Wake up', 'Nap', 'Insomnia', 'Great sleep', 'Bad sleep'],
    enabled: true,
    order: 3,
  },
  {
    id: 'mood',
    name: 'Mood & Mental Health',
    icon: '🧠',
    color: '#EAB308',
    subcategories: ['Happy', 'Sad', 'Stressed', 'Relaxed', 'Angry', 'Motivated', 'Tired', 'Anxious', 'Euphoric', 'Depressed', 'Neutral'],
    enabled: true,
    order: 4,
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    icon: '🍽️',
    color: '#F97316',
    subcategories: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Cheat Meal', 'Fasting', 'Supplements'],
    enabled: true,
    order: 5,
  },
  {
    id: 'finance',
    name: 'Money & Finances',
    icon: '💰',
    color: '#22C55E',
    subcategories: ['Expense', 'Income', 'Savings', 'Investment', 'Debt payment', 'Impulse buy', 'Subscription'],
    enabled: true,
    order: 6,
  },
  {
    id: 'social',
    name: 'Social Life',
    icon: '👥',
    color: '#06B6D4',
    subcategories: ['Friends', 'Family', 'Partner', 'Party', 'Event', 'Networking', 'Alone time', 'Online call'],
    enabled: true,
    order: 7,
  },
  {
    id: 'work',
    name: 'Work & Productivity',
    icon: '⚡',
    color: '#6366F1',
    subcategories: ['Deep Work', 'Meeting', 'Planning', 'Procrastinated', 'Flow State', 'Overtime', 'Break'],
    enabled: true,
    order: 8,
  },
  {
    id: 'health',
    name: 'Health & Body',
    icon: '🏥',
    color: '#EC4899',
    subcategories: ['Medication', 'Doctor visit', 'Sick', 'Headache', 'Pain', 'High energy', 'Low energy', 'Supplement'],
    enabled: true,
    order: 9,
  },
]

export function getCategoryById(id: CategoryId, categories: Category[] = DEFAULT_CATEGORIES): Category {
  return categories.find((c) => c.id === id) ?? DEFAULT_CATEGORIES[0]
}
