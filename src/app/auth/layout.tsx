import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account',
  description: 'Sign in or create your free Lead the Wild account.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
