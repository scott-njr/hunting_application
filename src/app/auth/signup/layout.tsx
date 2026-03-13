import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your free Lead the Wild account. Get started with hunting, archery, firearms, fishing, fitness, and medical training tools.',
  alternates: { canonical: '/auth/signup' },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
