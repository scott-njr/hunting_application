'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  // H1: Large lesson title with bottom border
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-primary mb-6 pb-4 border-b border-subtle">
      {children}
    </h1>
  ),

  // H2: Section headers with accent left border
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-primary mt-10 mb-4 pl-4 border-l-3 border-accent">
      {children}
    </h2>
  ),

  // H3: Subsection headers
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-primary mt-7 mb-3">
      {children}
    </h3>
  ),

  // Paragraphs with better line height
  p: ({ children }) => (
    <p className="text-secondary text-[15px] leading-[1.8] mb-4">
      {children}
    </p>
  ),

  // Strong/bold text
  strong: ({ children }) => (
    <strong className="text-primary font-semibold">{children}</strong>
  ),

  // Links
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-accent-hover hover:underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  // Blockquotes as callout/insight boxes
  blockquote: ({ children }) => (
    <div className="my-6 bg-accent-dim/40 border border-accent-border/30 rounded-lg px-5 py-4">
      <div className="text-accent-hover text-xs font-bold uppercase tracking-wider mb-2">Key Insight</div>
      <div className="text-secondary text-[15px] leading-relaxed [&>p]:mb-0">
        {children}
      </div>
    </div>
  ),

  // Unordered lists
  ul: ({ children }) => (
    <ul className="my-4 space-y-2.5 ml-1">
      {children}
    </ul>
  ),

  // Ordered lists
  ol: ({ children }) => (
    <ol className="my-4 space-y-2.5 ml-1 list-none counter-reset-[item]">
      {children}
    </ol>
  ),

  // List items with custom styling
  li: ({ children, ...props }) => {
    const isOrdered = (props as { node?: { parentNode?: { tagName?: string } } }).node?.parentNode?.tagName === 'ol'

    if (isOrdered) {
      return (
        <li className="flex gap-3 text-secondary text-[15px] leading-relaxed counter-increment-[item]">
          <span className="bg-accent-dim text-accent-hover w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 before:content-[counter(item)]" />
          <span className="flex-1">{children}</span>
        </li>
      )
    }

    return (
      <li className="flex gap-3 text-secondary text-[15px] leading-relaxed">
        <span className="text-accent mt-2 shrink-0">
          <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3" /></svg>
        </span>
        <span className="flex-1">{children}</span>
      </li>
    )
  },

  // Tables with classroom styling
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-subtle">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-elevated/80">
      {children}
    </thead>
  ),

  th: ({ children }) => (
    <th className="text-primary text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 border-b border-subtle">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="text-secondary text-sm px-4 py-3 border-b border-subtle/60">
      {children}
    </td>
  ),

  tr: ({ children }) => (
    <tr className="hover:bg-elevated/40 transition-colors">
      {children}
    </tr>
  ),

  // Horizontal rules as section dividers
  hr: () => (
    <div className="my-8 flex items-center gap-3">
      <div className="flex-1 h-px bg-subtle" />
      <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
      <div className="flex-1 h-px bg-subtle" />
    </div>
  ),

  // Code blocks
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className="block bg-elevated rounded-lg p-4 text-secondary text-sm font-mono overflow-x-auto border border-subtle">
          {children}
        </code>
      )
    }
    return (
      <code className="bg-elevated text-accent-hover px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    )
  },

  pre: ({ children }) => (
    <pre className="my-4">{children}</pre>
  ),
}

export function CourseMarkdown({ content }: { content: string }) {
  return (
    <div className="course-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
