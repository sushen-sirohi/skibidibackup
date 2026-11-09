"use client"

import type React from "react"

import { Search, Mic, Sliders, X } from "lucide-react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { SearchResults } from "./search-results"

interface SearchBarProps {
  onSearch: (query: string) => void
}

const SEARCH_SHORTCUTS = [
  { prefix: "from:", label: "From", placeholder: "sender name" },
  { prefix: "to:", label: "To", placeholder: "recipient name" },
  { prefix: "subject:", label: "Subject", placeholder: "keywords" },
  { prefix: "has:", label: "Has", options: ["attachment", "label"] },
  { prefix: "is:", label: "Status", options: ["unread", "starred", "important"] },
  { prefix: "date:", label: "Date", placeholder: "YYYY-MM-DD" },
]

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const [debouncedQuery, setDebouncedQuery] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      onSearch(query)
    }, 50)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  const parsedFilters = useMemo(() => {
    const filters: Record<string, string[]> = {}
    const shortcuts = SEARCH_SHORTCUTS.map((s) => s.prefix)

    shortcuts.forEach((shortcut) => {
      const regex = new RegExp(`${shortcut}\\s*([^\\s]+)`, "g")
      let match
      while ((match = regex.exec(query)) !== null) {
        if (!filters[shortcut]) filters[shortcut] = []
        filters[shortcut].push(match[1])
      }
    })

    return filters
  }, [query])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowResults(value.length > 0)
  }

  const handleVoiceSearch = () => {
    setIsListening(!isListening)
    if (!isListening) {
      if (navigator.vibrate) navigator.vibrate(20)
    }
  }

  const handleRemoveFilter = (filter: string) => {
    setQuery((prev) => prev.replace(new RegExp(`${filter}\\s*\\S+\\s*`), "").trim())
  }

  const handleAddFilter = useCallback((filter: string) => {
    searchInputRef.current?.focus()
    setQuery((prev) => (prev ? `${prev} ${filter}` : filter))
    setShowResults(true)
  }, [])

  const handleClear = () => {
    setQuery("")
    setShowResults(false)
    searchInputRef.current?.focus()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }

    window.addEventListener("mousedown", handleClickOutside)
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div
      ref={searchContainerRef}
      className="px-4 py-2 border-b border-border/40 bg-background/30 backdrop-blur-sm relative z-10"
    >
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search emails, people, subjects..."
            value={query}
            onChange={handleChange}
            onFocus={() => query.length > 0 && setShowResults(true)}
            className="pl-10 py-2 h-10 bg-transparent border border-border/60 hover:border-border focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl text-sm transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Voice search */}
        <button
          onClick={handleVoiceSearch}
          className={`p-2 rounded-xl border transition-all ${
            isListening
              ? "bg-destructive/90 border-destructive/40 text-destructive-foreground"
              : "bg-transparent border-border/60 text-muted-foreground hover:bg-muted/40"
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Filters button */}
        <button className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:bg-muted/40 transition-colors">
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Active filters display */}
      {Object.keys(parsedFilters).length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.entries(parsedFilters).map(([prefix, values]) =>
            values.map((value, idx) => (
              <div
                key={`${prefix}-${idx}`}
                className="px-3 py-1 text-xs rounded-full bg-primary/15 text-primary flex items-center gap-2"
              >
                <span className="font-mono">{prefix}</span>
                <span>{value}</span>
                <button onClick={() => handleRemoveFilter(`${prefix}${value}`)} className="ml-1 hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )),
          )}
        </div>
      )}

      {/* Search shortcuts hints */}
      {query.length === 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {SEARCH_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.prefix}
              onClick={() => handleAddFilter(shortcut.prefix)}
              className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title={shortcut.placeholder || shortcut.options?.join(", ")}
            >
              {shortcut.prefix}
            </button>
          ))}
        </div>
      )}

      {/* Search results dropdown */}
      {showResults && query.length > 0 && (
        <SearchResults query={query} filters={parsedFilters} onFilterSelect={handleAddFilter} />
      )}
    </div>
  )
}
