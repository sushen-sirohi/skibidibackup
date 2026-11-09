"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Trash2, Star, Reply, Forward, Mail, Tag, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface EmailDetailViewProps {
  emailId: string
  threadId?: string
  onClose: () => void
}

interface EmailDetail {
  id: string
  from_name?: string | null
  from_address: string
  subject: string
  body?: string | null
  date: string
  is_read?: boolean
}

export function EmailDetailView({ emailId, threadId, onClose }: EmailDetailViewProps) {
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [thread, setThread] = useState<EmailDetail[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        if (threadId) {
          const res = await fetch(`/api/threads/${threadId}`)
          if (!res.ok) throw new Error("Failed to load thread")
          const data = await res.json()
          if (!cancelled) {
            setThread(data.messages || [])
            const last = (data.messages || [])[data.messages.length - 1] || null
            setEmail(last)
          }
        } else {
          const res = await fetch(`/api/emails/${emailId}`)
          if (!res.ok) throw new Error("Failed to load email")
          const data = await res.json()
          if (!cancelled) setEmail(data)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load email")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [emailId, threadId])

  useEffect(() => {
    const markAsRead = async () => {
      if (!email || email.is_read) return
      setEmail({ ...email, is_read: true })
      try {
        const resp = await fetch(`/api/emails/${email.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_read: true }),
        })
        if (!resp.ok) {
          const text = await resp.text()
          console.error("mark-read failed", resp.status, text)
        } else {
          const data = await resp.json().catch(() => ({}))
          if (!data.ok) console.error("mark-read response error", data)
        }
        window.dispatchEvent(new Event("emails-read"))
      } catch (e) {
        // ignore for UI smoothness; server best-effort
        console.error("mark-read exception", e)
      }
    }
    markAsRead()
  }, [email])

  const cleanName = useMemo(() => {
    const raw = email?.from_name || ""
    return raw.replace(/<[^>]*>/g, "").replace(/\"/g, "").trim() || email?.from_address.split("@")[0] || ""
  }, [email])

  const initials = useMemo(() => {
    if (!cleanName) return "?"
    const parts = cleanName.split(" ").filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [cleanName])

  const formattedDate = useMemo(() => {
    return email ? new Date(email.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : ""
  }, [email])

  const isHtmlBody = useMemo(() => {
    const b = email?.body || ""
    return /<\w+[^>]*>/.test(b)
  }, [email])

  return (
    <div className="w-full lg:w-[38%] xl:w-[34%] border-l border-border bg-card/95 backdrop-blur-sm flex flex-col overflow-hidden shadow-2xl spring-enter">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Message
          </p>
          <h2 className="font-semibold text-foreground truncate text-base">{email ? email.subject : "Email Details"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <Star className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/6 bg-muted rounded animate-pulse" />
            <div className="h-32 w-full bg-muted rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : thread && thread.length > 0 ? (
          <div className="space-y-8">
            {thread.map((m) => {
              const isHtml = /<\w+[^>]*>/.test(m.body || "")
              const displayName = (m.from_name || "").replace(/<[^>]*>/g, "").replace(/\"/g, "").trim() || m.from_address.split("@")[0]
              const initialsThread = displayName
                ? displayName
                    .split(" ")
                    .filter(Boolean)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?"
              return (
                <div key={m.id} className="rounded-2xl border border-border/60 bg-card/60 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-border/60">
                      <AvatarFallback>{initialsThread}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">{m.from_address}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(m.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                      <Separator className="my-3" />
                      {m.body ? (
                        isHtml ? (
                          <div
                            className="prose prose-invert prose-sm max-w-none leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: m.body || "" }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{m.body}</pre>
                        )
                      ) : (
                        <div className="text-sm text-muted-foreground">No content</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : email ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border border-border/60">
                <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground truncate text-base">{cleanName}</p>
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {email.from_address}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <Clock className="h-3.5 w-3.5" />
                  {formattedDate}
                  <Separator orientation="vertical" className="h-4" />
                  <Tag className="h-3.5 w-3.5" />
                  <span className="text-xs text-muted-foreground">Thread</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="font-medium text-foreground">Subject:</span>
                <span className="truncate">{email.subject}</span>
              </div>
              <Separator />
              {email.body ? (
                isHtmlBody ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: email.body || "" }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{email.body}</pre>
                )
              ) : (
                <div className="text-sm text-muted-foreground">No content</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-border bg-card/90 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1 justify-center gap-2">
            <Reply className="w-4 h-4" />
            Reply
          </Button>
          <Button variant="secondary" className="flex-1 justify-center gap-2">
            <Forward className="w-4 h-4" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  )
}
