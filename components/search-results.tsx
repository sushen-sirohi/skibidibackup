"use client"

import { useState, useMemo, useEffect } from "react"
import { Mail } from "lucide-react"

interface Email {
  id: string
  from: string
  subject: string
  preview: string
  timestamp: string
  category: string
}

interface SearchResultsProps {
  query: string
  filters: Record<string, string[]>
  onFilterSelect: (filter: string) => void
}

// Mock data for instant typeahead
const MOCK_CONTACTS = [
  { name: "Sarah Chen", email: "sarah@company.com", frequent: true },
  { name: "Alex Rivera", email: "alex@example.com", frequent: true },
  { name: "Design Team", email: "design@company.com", frequent: false },
  { name: "John Smith", email: "john@company.com", frequent: false },
]

const MOCK_SUBJECTS = [
  "Project Alpha - Q4 Goals Review",
  "New Design System Components",
  "Coffee this weekend?",
  "Your Weekly Tech Digest",
  "Meeting Notes",
  "Action Items",
]

function fuzzyMatch(query: string, text: string): number {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()

  if (textLower.includes(queryLower)) return 100 // Exact substring match
  if (textLower.startsWith(queryLower)) return 90 // Starts with match

  let matches = 0
  let queryIdx = 0
  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      matches++
      queryIdx++
    }
  }

  return queryIdx === queryLower.length ? (matches / textLower.length) * 100 : 0
}

export function SearchResults({ query, filters, onFilterSelect }: SearchResultsProps) {
  const [isSearching, setIsSearching] = useState(true)

  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => setIsSearching(false), 200)
    return () => clearTimeout(timer)
  }, [query])

  const results = useMemo(() => {
    const queryWithoutFilters = query.replace(/\w+:\s*\S+/g, "").trim()

    if (!queryWithoutFilters) return { contacts: [], subjects: [], emails: [] }

    // Fuzzy search contacts
    const contactResults = MOCK_CONTACTS.map((contact) => ({
      ...contact,
      score: Math.max(fuzzyMatch(queryWithoutFilters, contact.name), fuzzyMatch(queryWithoutFilters, contact.email)),
    }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // Fuzzy search subjects
    const subjectResults = MOCK_SUBJECTS.map((subject) => ({
      subject,
      score: fuzzyMatch(queryWithoutFilters, subject),
    }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return {
      contacts: contactResults,
      subjects: subjectResults,
      emails: [],
    }
  }, [query])

  return (
    <div className="absolute top-full left-4 right-4 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
      {isSearching ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          <div className="skeleton h-4 w-32 mx-auto mb-2" />
          <div className="skeleton h-4 w-24 mx-auto" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {/* Contacts Section */}
          {results.contacts.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase">People</p>
              </div>
              {results.contacts.map((contact) => (
                <button
                  key={contact.email}
                  onClick={() => onFilterSelect(`from:${contact.email}`)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {contact.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                  </div>
                  {contact.frequent && <div className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Subjects Section */}
          {results.subjects.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Subjects</p>
              </div>
              {results.subjects.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => onFilterSelect(`subject:${result.subject}`)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{result.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{Math.round(result.score)}%</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {results.contacts.length === 0 && results.subjects.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Mail className="w-8 h-8 opacity-20 mx-auto mb-2" />
              <p>No results found</p>
            </div>
          )}
        </div>
      )}

      {/* Quick filter suggestions */}
      {!isSearching && (
        <div className="px-4 py-3 bg-muted/20 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Quick filters:</p>
          <div className="flex gap-1 flex-wrap">
            {["is:unread", "has:attachment", "is:starred"].map((filter) => (
              <button
                key={filter}
                onClick={() => onFilterSelect(filter)}
                className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
