import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Lead the Wild account. Access hunting tools, fitness coaching, courses, and community.',
  alternates: { canonical: '/auth/login' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
