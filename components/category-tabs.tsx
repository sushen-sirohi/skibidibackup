"use client"

import type React from "react"
import { useState } from "react"

interface CategoryTab {
  id: string
  label: string
  color: string
  count: number
  icon: React.ReactNode
  description: string
}

interface CategoryTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  categories: CategoryTab[]
  rightSlot?: React.ReactNode
}

export function CategoryTabs({ activeTab, onTabChange, categories, rightSlot }: CategoryTabsProps) {
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true)

  return (
    <div className="bg-background/80 backdrop-blur-sm border-b border-border/70">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Tabs (scrollable) */}
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Mail folders">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onTabChange(category.id)}
              className={`relative overflow-hidden px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === category.id
                  ? `${category.color} text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]`
                  : "border border-border/50 bg-card/60 backdrop-blur-sm text-[#6B7280] hover:text-foreground hover:border-border"
              }`}
              role="tab"
              aria-selected={activeTab === category.id}
            >
              {activeTab !== category.id && (
                <span
                  className={`pointer-events-none absolute inset-0 rounded-lg opacity-0 hover:opacity-15 transition-opacity duration-300 ease-out ${category.color}`}
                />
              )}
              {category.icon}
              <span>{category.label}</span>
              <span className={`text-xs font-semibold ${activeTab === category.id ? "opacity-80" : "text-[#6B7280]"}`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
        {/* Right controls */}
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </div>
  )
}
