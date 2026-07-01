import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { DEFAULT_CATEGORIES, getCategoryName } from '@/lib/categories'
import { EntryCard } from './EntryCard'
import { EntryBottomSheet } from './EntryBottomSheet'
import { SearchResults } from './SearchResults'
import { EmptyState } from '@/components/EmptyState'

export function LogScreen() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const openEntrySheet = useUIStore((s) => s.openEntrySheet)
  const entries = useEntriesStore((s) => s.entries)
  const { profile } = useProfileStore()

  // Filter categories by user's selectedCategories
  const visibleCategories = DEFAULT_CATEGORIES

  // Last 20 entries
  const recentEntries = entries.slice(0, 20)

  const isSearching = searchQuery.length > 0

  return (
    <div className="screen">
      {/* Search bar */}
      <div
        className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('log.searchPlaceholder')}
            className="flex-1 text-sm bg-transparent"
            style={{ color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        /* Search results */
        <SearchResults query={searchQuery} />
      ) : (
        <>
          {/* Category quick-log grid */}
          <div className="px-4 pt-4 pb-2">
            <div className="section-header">
              <span className="section-title">{t('home.quickLog')}</span>
            </div>
            <div className="quick-log-grid">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="quick-log-item"
                  style={{
                    background: `${cat.color}12`,
                    borderColor: `${cat.color}25`,
                    transition: 'all 150ms ease',
                  }}
                  onClick={() => openEntrySheet(cat.id)}
                >
                  <span className="quick-log-emoji" style={{ fontSize: '28px' }}>{cat.icon}</span>
                  <span className="quick-log-label" style={{ color: '#F5F5F5' }}>
                    {/* Shorten long names for grid display */}
                    {cat.id === 'substances'
                      ? t('log.shortSubstances')
                      : cat.id === 'intimacy'
                      ? t('log.shortIntimacy')
                      : cat.id === 'nutrition'
                      ? t('log.shortNutrition')
                      : cat.id === 'finance'
                      ? t('log.shortFinance')
                      : cat.id === 'social'
                      ? t('log.shortSocial')
                      : getCategoryName(cat, profile.language).split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Recent Entries */}
          <div className="px-4 pb-2">
            <div className="section-header">
              <span className="section-title">{t('log.recentEntries')}</span>
            </div>
          </div>

          {recentEntries.length === 0 ? (
            <EmptyState
              icon="📋"
              message={t('log.noEntriesMessage')}
            />
          ) : (
            <AnimatePresence initial={false}>
              {recentEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          )}
        </>
      )}

      {/* Entry form sheet */}
      <EntryBottomSheet />
    </div>
  )
}
