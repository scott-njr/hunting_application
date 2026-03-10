import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Get In Touch',
  description: 'Get in touch with the Lead the Wild team. Questions about modules, subscriptions, partnerships, or feedback.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
