import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Lead the Wild',
  description: 'Sign in or create your Lead the Wild account to access AI coaching, courses, community, and field tools across all modules.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
