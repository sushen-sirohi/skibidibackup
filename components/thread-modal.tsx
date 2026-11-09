"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Star, Archive, Trash2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

type Msg = {
  id: string
  from_name?: string | null
  from_address: string
  subject: string
  body?: string | null
  date: string
}

// Simple in-memory cache for quick reopens within session
const threadCache = new Map<string, Msg[]>()

interface ThreadModalProps {
  open: boolean
  onClose: () => void
  emailId: string | null
  threadId?: string | null
}

export function ThreadModal({ open, onClose, emailId, threadId }: ThreadModalProps) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [expandHeavy, setExpandHeavy] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!open) return
      if (!threadId && !emailId) return
      try {
        setLoading(true)
        if (threadId) {
          // Serve cached immediately if present
          const cached = threadCache.get(threadId)
          if (cached) setMsgs(cached)
          const r = await fetch(`/api/threads/${threadId}`)
          if (!r.ok) throw new Error("Failed to load thread")
          const data = await r.json()
          if (!cancelled) {
            const arr = (data.messages || []) as Msg[]
            setMsgs(arr)
            threadCache.set(threadId, arr)
          }
        } else if (emailId) {
          const r = await fetch(`/api/emails/${emailId}`)
          if (!r.ok) throw new Error("Failed to load email")
          const data = await r.json()
          if (!cancelled) setMsgs([data])
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, threadId, emailId])

  const subject = useMemo(() => msgs[msgs.length - 1]?.subject || "Conversation", [msgs])
  const visibleMsgs = useMemo(() => {
    if (showAll) return msgs
    // Show only the last 2 messages expanded by default for speed
    return msgs.slice(Math.max(0, msgs.length - 2))
  }, [msgs, showAll])

  function enhanceHtml(s: string) {
    try {
      // Add loading="lazy" to images and target _blank to anchors
      return s
        .replace(/<img\b([^>]*)>/gi, (m, attrs) => `<img loading="lazy" ${attrs}>`)
        .replace(/<a\b([^>]*)>/gi, (m, attrs) => {
          const hasTarget = /target=\"?_blank\"?/i.test(attrs)
          const hasRel = /rel=\"?[^\"]*\"?/i.test(attrs)
          return `<a ${attrs} ${hasTarget ? "" : 'target="_blank"'} ${hasRel ? "" : 'rel="noopener noreferrer"'}>`
        })
    } catch {
      return s
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "block" : "hidden"}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-4 md:inset-10 rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 border-b border-border flex items-center justify-between bg-card/90 backdrop-blur">
          <div className="min-w-0">
            <div className="text-base md:text-lg font-semibold text-foreground truncate">{subject}</div>
            <div className="text-xs text-muted-foreground truncate">{msgs.length} message{msgs.length === 1 ? "" : "s"}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="Star"><Star className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" title="Archive"><Archive className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" title="Delete"><Trash2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
              <div className="h-3 w-4/6 bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/6 bg-muted rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : msgs.length > 0 ? (
            <div className="space-y-8">
              {!showAll && msgs.length > visibleMsgs.length ? (
                <div className="flex justify-center">
                  <button
                    className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    onClick={() => setShowAll(true)}
                  >
                    Show {msgs.length - visibleMsgs.length} older messages
                  </button>
                </div>
              ) : null}
              {visibleMsgs.map((m) => {
                const isHtml = /<\w+[^>]*>/.test(m.body || "")
                const name = (m.from_name || "").replace(/<[^>]*>/g, "").replace(/\"/g, "").trim() || m.from_address.split("@")[0]
                const isHeavy = (m.body?.length || 0) > 200_000
                const expanded = !!expandHeavy[m.id]
                return (
                  <div key={m.id}>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-medium text-foreground/80">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-foreground truncate">{name}</div>
                          <div className="text-xs text-muted-foreground shrink-0">{new Date(m.date).toLocaleString()}</div>
                        </div>
                        <div className="mt-3 border border-border rounded-lg p-3 bg-background">
                          {m.body ? (
                            isHtml ? (
                              isHeavy && !expanded ? (
                                <div className="text-xs text-muted-foreground">
                                  Large message content hidden for speed.
                                  <button
                                    className="ml-2 underline hover:text-foreground"
                                    onClick={() => setExpandHeavy((s) => ({ ...s, [m.id]: true }))}
                                  >
                                    Load full content
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="prose prose-invert max-w-none text-sm leading-relaxed [&_*]:!max-w-full [&_img]:rounded [&_table]:block [&_table]:overflow-x-auto [&_pre]:whitespace-pre-wrap"
                                  dangerouslySetInnerHTML={{ __html: enhanceHtml(m.body || "") }}
                                />
                              )
                            ) : (
                              <pre className="whitespace-pre-wrap text-sm text-foreground">{m.body}</pre>
                            )
                          ) : (
                            <div className="text-sm text-muted-foreground">No content</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Reply composer */}
        <div className="px-4 md:px-6 py-3 border-t border-border bg-card/90 backdrop-blur">
          <div className="flex items-end gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a quick reply…"
              className="flex-1 resize-none rounded-md border border-border bg-background text-sm p-3 min-h-[44px] max-h-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button size="sm" disabled={!reply.trim()}>
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
