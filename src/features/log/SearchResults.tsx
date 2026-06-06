import { AnimatePresence } from 'framer-motion'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { EntryCard } from './EntryCard'
import { EmptyState } from '@/components/EmptyState'

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  const searchEntries = useEntriesStore((s) => s.searchEntries)
  const results = searchEntries(query)

  return (
    <div>
      {/* Results header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-xs uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>
          {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="🔍"
          message={`No entries found for "${query}"`}
        />
      ) : (
        <AnimatePresence initial={false}>
          {results.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
