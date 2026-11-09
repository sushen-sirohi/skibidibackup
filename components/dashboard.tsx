"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n || 0)
}

function Sparkline({ data, color = "#3b82f6" }: { data: Array<number>; color?: string }) {
  if (!data || data.length === 0) return null
  const w = 120
  const h = 28
  const max = Math.max(...data, 1)
  const step = w / (data.length - 1)
  const points = data
    .map((v, i) => {
      const x = i * step
      const y = h - (v / max) * h
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-75">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  )
}

export function Dashboard({
  onOpenEmail,
  onFilter,
  onGoInbox,
}: {
  onOpenEmail?: (id: string) => void
  onFilter?: (query: string) => void
  onGoInbox?: () => void
}) {
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")

  // Initialize lastSeen; load user name
  useEffect(() => {
    ;(async () => {
      try {
        const ls = localStorage.getItem("last_seen")
        if (!ls) {
          const now = new Date().toISOString()
          localStorage.setItem("last_seen", now)
          setLastSeen(now)
        } else {
          setLastSeen(ls)
        }
      } catch {}
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) setUserName((user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "")
      } catch {}
    })()
  }, [])

  const { data, isLoading, mutate } = useSWR(
    lastSeen ? `/api/dashboard/metrics?lastSeen=${encodeURIComponent(lastSeen)}` : null,
    fetcher,
    { revalidateOnFocus: true },
  )

  const dailyTotals = useMemo(() => (data?.dailyCounts || []).map((d: any) => d.total), [data])
  const dailyUnread = useMemo(() => (data?.dailyCounts || []).map((d: any) => d.unread), [data])
  const topContacts = useMemo(() => data?.topContacts || [], [data])
  const important = useMemo(() => data?.importantEmails || [], [data])

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Hero */}
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Welcome back</div>
              <div className="text-2xl font-semibold">{userName ? `${userName}` : "Dashboard"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isLoading ? "—" : `${formatNumber(data?.sinceLastSeen)} new since your last visit · ${new Date().toLocaleTimeString()}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm rounded-md border bg-card hover:bg-muted" onClick={() => mutate()}>
                Refresh
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md border bg-card hover:bg-muted"
                onClick={() => {
                  const now = new Date().toISOString()
                  localStorage.setItem("last_seen", now)
                  setLastSeen(now)
                  mutate()
                }}
              >
                Mark as seen
              </button>
              {onGoInbox && (
                <button className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground" onClick={onGoInbox}>
                  Go to Inbox
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs + trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[{
          label: "Total emails",
          value: data?.total,
          series: dailyTotals,
          color: "#4f46e5",
        },
        {
          label: "Unread",
          value: data?.unread,
          series: dailyUnread,
          color: "#ef4444",
        },
        {
          label: "Starred",
          value: data?.starred,
          series: dailyTotals,
          color: "#f59e0b",
        },
        {
          label: "New since last open",
          value: data?.sinceLastSeen,
          series: dailyTotals,
          color: "#10b981",
        }].map((kpi, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-2">
              <div className="text-3xl font-semibold">{isLoading ? "—" : formatNumber(kpi.value)}</div>
              <Sparkline data={kpi.series || []} color={kpi.color} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* What you missed */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">What you missed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries((data?.byCategory || {}) as Record<string, number>).map(([cat, count]) => (
                <button
                  key={cat}
                  className="rounded-md border p-3 bg-background text-left hover:bg-muted transition"
                  onClick={() => onFilter && onFilter(`category:${cat}`)}
                >
                  <div className="text-xs text-muted-foreground capitalize">{cat}</div>
                  <div className="text-xl font-semibold">{formatNumber(count)}</div>
                </button>
              ))}
              {(!data?.byCategory || Object.keys(data.byCategory).length === 0) && (
                <div className="text-sm text-muted-foreground">No data yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Top contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topContacts.map((s: any) => (
                <li key={s.address} className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2 min-w-0 hover:opacity-90"
                    onClick={() => onFilter && onFilter(`from:${s.address}`)}
                  >
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                      {(s.name || s.address).slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[180px]" title={s.name || s.address}>
                      {s.name || s.address}
                    </span>
                  </button>
                  <span className="text-sm text-muted-foreground">{formatNumber(s.count)}</span>
                </li>
              ))}
              {topContacts.length === 0 && <li className="text-sm text-muted-foreground">No contacts yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Important emails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Important right now</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {(important || []).map((m: any) => (
              <button
                key={m.id}
                className="w-full text-left py-2 flex items-center justify-between hover:bg-muted/60 px-2 rounded-md"
                onClick={() => onOpenEmail && onOpenEmail(m.id)}
              >
                <div className="min-w-0 pr-3">
                  <div className="text-sm font-medium truncate">{m.subject || "(No subject)"}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.from}</div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</div>
              </button>
            ))}
            {(!important || important.length === 0) && (
              <div className="text-sm text-muted-foreground">You're all caught up.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Last seen: {lastSeen ? new Date(lastSeen).toLocaleString() : "—"} · Updated: {data?.now ? new Date(data.now).toLocaleTimeString() : "—"}
      </div>
    </div>
  )
}
