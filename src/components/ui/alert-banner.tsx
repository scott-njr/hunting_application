import { cn } from '@/lib/utils'

const VARIANT_STYLES = {
  error: 'bg-red-950/50 border border-red-500/30 text-red-400',
  success: 'bg-green-950/50 border border-green-500/30 text-green-400',
  warning: 'bg-amber-900/30 border border-amber-500/30 text-amber-400',
  info: 'bg-blue-950/30 border border-blue-500/20 text-blue-300',
} as const

type AlertVariant = keyof typeof VARIANT_STYLES

interface AlertBannerProps {
  variant: AlertVariant
  message: string
  className?: string
}

export function AlertBanner({ variant, message, className }: AlertBannerProps) {
  if (!message) return null
  return (
    <div className={cn('p-3 rounded text-sm', VARIANT_STYLES[variant], className)}>
      {message}
    </div>
  )
}
