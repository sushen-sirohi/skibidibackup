"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { EmailListItem } from "./email-list-item"
import { EmailSkeleton } from "./email-skeleton"
import { useEmails, type Email } from "@/lib/hooks/use-emails"

interface EmailListContainerProps {
  searchQuery: string
  selectedEmailId: string | null
  onSelectEmail: (emailId: string, threadId?: string) => void
  category: string
}

export function EmailListContainer({ searchQuery, selectedEmailId, onSelectEmail, category }: EmailListContainerProps) {
  const { emails, isLoading, mutate } = useEmails(category)
  const listRef = useRef<HTMLDivElement>(null)

  // Refresh list when a manual sync completes or a read event fires
  useEffect(() => {
    const handler = () => mutate()
    window.addEventListener("emails-sync-done", handler)
    window.addEventListener("emails-read", handler)
    return () => {
      window.removeEventListener("emails-sync-done", handler)
      window.removeEventListener("emails-read", handler)
    }
  }, [mutate])

  // Friendly timestamp formatter
  // - Today: h:mm AM/PM
  // - This year: Mon D
  // - Else: M/D/YY
  const formatTimestamp = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const sameDay =
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    }
    const sameYear = d.getFullYear() === now.getFullYear()
    if (sameYear) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    }
    return d.toLocaleDateString(undefined, { year: "2-digit", month: "numeric", day: "numeric" })
  }

  const filteredEmails = (Array.isArray(emails) ? emails : []).filter((email) => {
    const query = searchQuery.toLowerCase()

    const fromMatch = searchQuery.match(/from:(\S+)/i)
    const subjectMatch = searchQuery.match(/subject:([^]*?)(?=\s+\w+:|$)/i)
    const isMatch = searchQuery.match(/is:(\S+)/i)
    const hasMatch = searchQuery.match(/has:(\S+)/i)

    if (fromMatch && !email.from_address.toLowerCase().includes(fromMatch[1].toLowerCase())) return false
    if (subjectMatch && !email.subject.toLowerCase().includes(subjectMatch[1].toLowerCase())) return false
    if (isMatch) {
      const isType = isMatch[1].toLowerCase()
      if (isType === "unread" && email.is_read) return false
      if (isType === "starred" && !email.is_starred) return false
    }

    const searchText = searchQuery
      .replace(/\w+:\s*\S+/g, "")
      .trim()
      .toLowerCase()
    if (!searchText) return true

    return (
      email.from_address.toLowerCase().includes(searchText) ||
      email.subject.toLowerCase().includes(searchText) ||
      email.preview.toLowerCase().includes(searchText)
    )
  })

  const handleEmailAction = async (e: React.MouseEvent, emailId: string, action: "archive" | "delete" | "star") => {
    e.stopPropagation()
    const doOptimistic = async () => {
      // Optimistic update
      const previous = await mutate(
        (current) => {
          if (!current) return current
          if (action === "star") {
            return current.map((m) => (m.id === emailId ? { ...m, is_starred: !m.is_starred } : m))
          }
          if (action === "delete") {
            return current.filter((m) => m.id !== emailId)
          }
          return current
        },
        { revalidate: false },
      )

      try {
        if (action === "star") {
          const resp = await fetch(`/api/emails/${emailId}/star`, { method: "POST" })
          if (!resp.ok) throw new Error("star failed")
        } else if (action === "delete") {
          const resp = await fetch(`/api/emails/${emailId}`, { method: "DELETE" })
          if (!resp.ok) throw new Error("delete failed")
        }
        // finally revalidate
        await mutate()
      } catch (err) {
        console.error("Email action failed", err)
        // revert on failure
        await mutate()
      }
    }

    doOptimistic()
  }

  // Group by thread when applicable
  const groups = (() => {
    const byKey = new Map<string, Email[]>()
    for (const e of filteredEmails) {
      const key = (e as any).thread_id || e.gmail_id || e.id
      const arr = byKey.get(key) || []
      arr.push(e)
      byKey.set(key, arr)
    }
    // Build group objects: latest message first
    const out = Array.from(byKey.entries()).map(([key, arr]) => {
      const sorted = [...arr].sort((a, b) => +new Date(b.date) - +new Date(a.date))
      const latest = sorted[0]
      const unreadCount = arr.filter((m) => !m.is_read).length
      return {
        key,
        list: arr,
        latest,
        total: arr.length,
        unreadCount,
      }
    })
    // Sort groups by latest date desc
    out.sort((a, b) => +new Date(b.latest.date) - +new Date(a.latest.date))
    return out
  })()

  return (
    <div
      ref={listRef}
      className="flex-1 border-r border-border/60 bg-card overflow-y-auto"
    >
      <div className="divide-y divide-border/60">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <EmailSkeleton key={i} />
            ))}
          </>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <div className="w-12 h-12 mb-4 opacity-20">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm">No emails found</p>
          </div>
        ) : (
          groups.map((group) => {
            const email = group.latest
            // Compute clean name and address from stored data
            const raw = email.from_address || ""
            let cleanAddr = raw
            let cleanName = email.from_name || ""
            const match = raw.match(/(?:\"([^\"]+)\"|([^<\"]+))?\s*<([^>]+)>/)
            if (match) {
              const nameFromRaw = (match[1] || match[2] || "").trim()
              const addrFromRaw = match[3].trim()
              cleanAddr = addrFromRaw
              if (!cleanName) cleanName = nameFromRaw
            }
            if (!cleanName) {
              // Fallback to local-part as a last resort
              cleanName = cleanAddr.split("@")[0]
            }
            const avatarChar = (cleanName || cleanAddr).charAt(0).toUpperCase()
            const unread = group.total > 1 ? group.unreadCount > 0 : !email.is_read

            const handleSelect = () => {
              if (unread) {
                mutate(
                  (current) =>
                    current?.map((m) => (m.id === email.id ? { ...m, is_read: true } : m)),
                  { revalidate: false },
                )
                fetch(`/api/emails/${email.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ is_read: true }),
                }).catch(() => {})
              }
              onSelectEmail(email.id, group.total > 1 ? ((email as any).thread_id || group.key) : undefined)
            }

            return (
              <EmailListItem
                key={group.key}
                email={{
                  id: email.id,
                  from: cleanName,
                  fromAddress: cleanAddr,
                  subject: group.total > 1 ? `[${group.total}] ${email.subject}` : email.subject,
                  preview: email.preview,
                  timestamp: new Date(email.date).toLocaleDateString(),
                  avatar: avatarChar,
                  category: (email.category as "inbox" | "starred" | "sent" | "drafts" | "trash" | "promotions") || "inbox",
                  unread: group.total > 1 ? group.unreadCount > 0 : !email.is_read,
                  starred: email.is_starred,
                }}
                isSelected={selectedEmailId === email.id}
                onSelect={handleSelect}
                onAction={handleEmailAction}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
