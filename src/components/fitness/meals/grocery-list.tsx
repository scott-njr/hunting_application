'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'

interface GroceryItem {
  item: string
  estimated_cost_usd: number
}

interface GroceryListProps {
  items: GroceryItem[]
  weeklyCost: number
}

export function GroceryList({ items, weeklyCost }: GroceryListProps) {
  const [expanded, setExpanded] = useState(false)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  function toggleItem(index: number) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-accent" />
          <h3 className="text-primary font-bold text-sm">Grocery List</h3>
          <span className="text-xs text-muted">~${weeklyCost.toFixed(2)}/week</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-subtle space-y-1.5">
          {items.map((item, i) => (
            <label
              key={i}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => toggleItem(i)}
                className="rounded border-subtle text-accent focus:ring-accent"
              />
              <span className={`text-xs flex-1 ${checked.has(i) ? 'text-muted line-through' : 'text-secondary'}`}>
                {item.item}
              </span>
              <span className="text-xs text-muted">
                ${item.estimated_cost_usd.toFixed(2)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
