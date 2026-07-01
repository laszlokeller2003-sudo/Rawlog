import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { t } = useTranslation()
  const PROMPTS = t('ai.suggestedPrompts', { returnObjects: true }) as string[]

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-6">
        <span className="text-3xl">🤖</span>
        <h3 className="font-heading font-bold text-text-primary mt-2 mb-1">{t('ai.yourAiPa')}</h3>
        <p className="text-text-secondary text-sm">
          {t('ai.askMeAnything')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PROMPTS.map((prompt, i) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-bg-card border border-border rounded-lg p-3 text-left text-sm text-text-secondary hover:border-border-subtle hover:text-text-primary transition-colors duration-150"
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
