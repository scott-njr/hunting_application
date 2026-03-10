type WordmarkSize = 'sm' | 'md' | 'lg'

const sizes: Record<WordmarkSize, { icon: number; text: string }> = {
  sm: { icon: 20, text: 'text-sm' },
  md: { icon: 26, text: 'text-base' },
  lg: { icon: 34, text: 'text-xl' },
}

export function PraeviusWordmark({ size = 'md' }: { size?: WordmarkSize }) {
  const s = sizes[size]
  const iconH = Math.round(s.icon * 0.7)
  return (
    <span className="inline-flex items-center gap-2 text-accent-hover">
      <svg
        width={s.icon}
        height={iconH}
        viewBox="0 0 100 70"
        fill="none"
        className="shrink-0"
      >
        <polygon points="50,5 68,60 32,60" fill="#6b8a5e" />
        <polygon points="28,22 48,60 8,60" fill="#96b388" opacity="0.65" />
        <polygon points="74,26 92,60 56,60" fill="#96b388" opacity="0.55" />
        <line x1="5" y1="63" x2="95" y2="63" stroke="#6b8a5e" strokeWidth="1.2" />
      </svg>
      <span className={`font-heading font-bold tracking-[0.14em] ${s.text}`}>
        LEAD THE WILD
      </span>
    </span>
  )
}
