"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ThreadRef = { threadId: string; emailId: string; subject: string; date: string; from?: string; to?: string }

interface OverviewData {
  rightNow: ThreadRef[]
  waitingOnYou: ThreadRef[]
  today: ThreadRef[]
  hot: ThreadRef[]
  promotionsCount: number
  now: string
}

interface SummaryData {
  summary: string
  mood: string
  count: number
  windowHours: number
}

export function Overview({ onOpenThread }: { onOpenThread: (emailId: string, threadId?: string) => void }) {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandToday, setExpandToday] = useState(false)
  const [expandHot, setExpandHot] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        const [o, s] = await Promise.all([
          fetch("/api/inbox/overview").then((r) => r.json()),
          fetch("/api/inbox/summary").then((r) => r.json()),
        ])
        if (!cancelled) {
          setOverview(o)
          setSummary(s)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    const t = setInterval(run, 60_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const mood = summary?.mood || "Normal"
  const moodEmoji = mood.toLowerCase().includes("fire") || mood.toLowerCase().includes("spicy")
    ? "🔥"
    : mood.toLowerCase().includes("calm") || mood.toLowerCase().includes("chill")
    ? "🌴"
    : "🟢"
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  // Limit visible items to ~25 at a glance (favor top buckets)
  const limited = useMemo(() => {
    const o = overview
    if (!o) return { rightNow: [], waitingOnYou: [], today: [], hot: [] as any[] }
    const rightNow = (o.rightNow || []).slice(0, 8)
    const waitingOnYou = (o.waitingOnYou || []).slice(0, 8)
    const used = rightNow.length + waitingOnYou.length
    const remaining = Math.max(25 - used, 0)
    // Split remaining between Today and Hot
    const half = Math.floor(remaining / 2)
    const today = (o.today || []).slice(0, Math.max(half, 0))
    const hot = (o.hot || []).slice(0, Math.max(remaining - today.length, 0))
    return { rightNow, waitingOnYou, today, hot }
  }, [overview])

  function hintOf(t: ThreadRef & { preview?: string }) {
    const text = `${t.subject || ""} ${t.preview || ""}`.toLowerCase()
    if (/invoice|payment|due|net\s*\d+|overdue/.test(text)) return "invoice due soon"
    if (/approve|approval|sign|signature|contract|docusign/.test(text)) return "wants approval"
    if (/meeting|call|schedule|calendar|resched|zoom|gmeet/.test(text)) return "scheduling"
    if (/thanks|thank you|appreciate|resolved|no action/.test(text)) return "no reply needed"
    if (/urgent|asap|immediately|critical|blocker|prod/.test(text)) return "urgent"
    if (/follow\s*up|checking in|bump/.test(text)) return "follow‑up"
    if (/intro|connect/.test(text)) return "intro"
    return "review"
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold text-foreground">{greeting}</div>
          <div className="text-sm text-muted-foreground">{mood} {moodEmoji} · {summary?.count ?? 0} messages in last 48h</div>
        </div>
        <div className="text-sm text-muted-foreground">{new Date(overview?.now || Date.now()).toLocaleString()}</div>
      </div>

      {/* One-liner */}
      <Card className="p-4 bg-card/60">
        <div className="text-sm text-muted-foreground">One‑liner</div>
        <div className="mt-2 text-[15px] leading-6 text-foreground">{summary?.summary || (loading ? "Loading..." : "Inbox looks normal – a few items need attention.")}</div>
      </Card>

      {/* Two column: Right Now / Waiting on you */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-medium mb-3">Right Now</div>
          <div className="space-y-2">
            {(limited.rightNow || []).map((t) => (
              <Row key={t.threadId} item={t} onOpenThread={onOpenThread} hint={hintOf(t as any)} unreadCount={(t as any).unreadCount} />
            ))}
            {(!limited.rightNow?.length && !loading) && <Empty label="Nothing urgent" />}
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-medium mb-3">Waiting on you</div>
          <div className="space-y-2">
            {(limited.waitingOnYou || []).map((t) => (
              <Row key={t.threadId} item={t} onOpenThread={onOpenThread} hint={hintOf(t as any)} unreadCount={(t as any).unreadCount} />
            ))}
            {(!limited.waitingOnYou?.length && !loading) && <Empty label="No follow‑ups pending" />}
          </div>
        </Card>
      </div>

      {/* Today */}
      <Card className="p-4">
        <button
          type="button"
          className="w-full flex items-center justify-between mb-3 group"
          aria-expanded={expandToday}
          onClick={() => setExpandToday((v) => !v)}
        >
          <div className="flex items-center gap-2">
            {expandToday ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            )}
            <span className="font-medium">Today</span>
          </div>
          <span className="text-xs rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            {limited.today?.length || 0}
          </span>
        </button>
        {expandToday && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {(limited.today || []).map((t) => (
              <Mini key={t.threadId} item={t} onOpenThread={onOpenThread} hint={hintOf(t as any)} unreadCount={(t as any).unreadCount} />
            ))}
            {(!limited.today?.length && !loading) && <Empty label="Quiet day so far" />}
          </div>
        )}
      </Card>

      {/* Starred & Hot */}
      <Card className="p-4">
        <button
          type="button"
          className="w-full flex items-center justify-between mb-3 group"
          aria-expanded={expandHot}
          onClick={() => setExpandHot((v) => !v)}
        >
          <div className="flex items-center gap-2">
            {expandHot ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            )}
            <span className="font-medium">Starred & Hot</span>
          </div>
          <span className="text-xs rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            {limited.hot?.length || 0}
          </span>
        </button>
        {expandHot && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {(limited.hot || []).map((t) => (
              <Mini key={t.threadId} item={t} onOpenThread={onOpenThread} hint={hintOf(t as any)} unreadCount={(t as any).unreadCount} />
            ))}
            {(!limited.hot?.length && !loading) && <Empty label="No hot threads" />}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <Card className="p-4 sticky bottom-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80 bg-card/95">
        <div className="font-medium mb-3">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">Write a quick reply</Button>
          <Button variant="secondary" size="sm">Snooze until 6 PM</Button>
          <Button variant="secondary" size="sm">Empty promotions</Button>
        </div>
      </Card>
    </div>
  )
}

function initials(s: string) {
  const base = (s || "").trim()
  if (!base) return "?"
  const parts = base.replace(/<[^>]*>/g, "").split(/[\s@._-]+/).filter(Boolean)
  const a = parts[0]?.[0] || "?"
  const b = parts[1]?.[0] || ""
  return (a + b).toUpperCase()
}

function colorFor(seed: string) {
  // Deterministic small hash to pick a palette index
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const palette = [
    "ring-rose-500/50",
    "ring-sky-500/50",
    "ring-emerald-500/50",
    "ring-amber-500/50",
    "ring-violet-500/50",
    "ring-cyan-500/50",
    "ring-indigo-500/50",
    "ring-fuchsia-500/50",
  ]
  return palette[h % palette.length]
}

function Row({ item, onOpenThread, hint, unreadCount }: { item: ThreadRef; onOpenThread: (emailId: string, threadId?: string) => void; hint?: string; unreadCount?: number }) {
  const who = item.from || item.to || ""
  return (
    <button
      className="w-full text-left p-3 rounded-md border border-border hover:bg-muted/60 transition-colors"
      onClick={() => onOpenThread(item.emailId, item.threadId)}
    >
      <div className="flex items-start gap-3">
        <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-medium text-foreground/80 ring-2 ${colorFor(who)}`}>
          {initials(who)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[13px] font-semibold text-foreground truncate">{who}</div>
            <div className="flex items-center gap-2 shrink-0">
              {unreadCount && unreadCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                  • {unreadCount}
                </span>
              ) : null}
              <div className="text-[11px] text-muted-foreground">{new Date(item.date).toLocaleString()}</div>
            </div>
          </div>
          <div className={`text-[13px] ${unreadCount && unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"} truncate mt-0.5`}>{item.subject}</div>
          {hint ? <div className="text-[12px] text-muted-foreground/80 truncate mt-0.5">{hint}</div> : null}
        </div>
      </div>
    </button>
  )
}

function Mini({ item, onOpenThread, hint, unreadCount }: { item: ThreadRef; onOpenThread: (emailId: string, threadId?: string) => void; hint?: string; unreadCount?: number }) {
  const who = item.from || item.to || ""
  return (
    <button
      className="w-full text-left p-3 rounded-md border border-border hover:bg-muted/60 transition-colors"
      onClick={() => onOpenThread(item.emailId, item.threadId)}
    >
      <div className="flex items-start gap-3">
        <div className={`h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-foreground/80 ring-2 ${colorFor(who)}`}>
          {initials(who)}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[13px] ${unreadCount && unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"} truncate`}>{item.subject}</div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-2">
            {unreadCount && unreadCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">• {unreadCount}</span>
            ) : null}
            <span>{new Date(item.date).toLocaleString()}</span>
          </div>
          {hint ? <div className="text-[12px] text-muted-foreground/80 truncate mt-0.5">{hint}</div> : null}
        </div>
      </div>
    </button>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="text-sm text-muted-foreground">{label}</div>
}
