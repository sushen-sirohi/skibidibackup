import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const lastSeenParam = url.searchParams.get("lastSeen")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: rows } = await supabase
      .from("emails")
      .select("id, from_address, from_name, is_read, is_starred, category, date, subject")
      .eq("user_id", user.id)

    const now = new Date()
    const lastSeen = lastSeenParam ? new Date(lastSeenParam) : new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const total = rows?.length || 0
    const unread = rows?.filter((r: any) => !r.is_read).length || 0
    const starred = rows?.filter((r: any) => !!r.is_starred).length || 0
    const sinceLastSeen = rows?.filter((r: any) => new Date(r.date) > lastSeen).length || 0

    const byCategory: Record<string, number> = {}
    const senderCount: Record<string, { name: string; address: string; count: number }> = {}
    const domainBlacklist = [
      "google.com",
      "googlemail.com",
      "steamcommunity.com",
      "steampowered.com",
      "facebookmail.com",
      "accounts.google.com",
      "noreply.github.com",
      "no-reply.apple.com",
      "doordash.com",
      "newsletters",
    ]
    const skipHeuristic = (addr: string, name: string) => {
      const lower = addr.toLowerCase()
      const dom = lower.split("@")[1] || ""
      if (!lower || lower.startsWith("no-reply") || lower.startsWith("noreply")) return true
      if (name && /noreply|no[- ]reply|notification|notifications|alert|newsletter/i.test(name)) return true
      if (domainBlacklist.some((d) => dom.endsWith(d))) return true
      return false
    }

    for (const r of rows || []) {
      const cat = r.category || "inbox"
      byCategory[cat] = (byCategory[cat] || 0) + 1

      const rawAddr = r.from_address || ""
      const addr = rawAddr.toLowerCase()
      const displayName = r.from_name || addr.split("@")[0]
      if (!addr || skipHeuristic(addr, displayName)) continue
      if (!senderCount[addr]) senderCount[addr] = { name: displayName, address: addr, count: 0 }
      senderCount[addr].count += 1
    }

    const topContacts = Object.values(senderCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Build 14-day daily counts for sparkline
    const days = 14
    const dailyCounts: Array<{ date: string; total: number; unread: number }> = []
    const perDay: Record<string, { total: number; unread: number }> = {}
    for (const r of rows || []) {
      const d = new Date(r.date)
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      if (!perDay[key]) perDay[key] = { total: 0, unread: 0 }
      perDay[key].total += 1
      if (!r.is_read) perDay[key].unread += 1
    }
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const val = perDay[key] || { total: 0, unread: 0 }
      dailyCounts.push({ date: key, total: val.total, unread: val.unread })
    }

    // Important (last 7 days): unread or starred
    const windowMs = 7 * 24 * 60 * 60 * 1000
    const cutoff = new Date(now.getTime() - windowMs)
    const importantEmails = (rows || [])
      .filter((r: any) => new Date(r.date) >= cutoff && (!r.is_read || r.is_starred))
      .sort((a: any, b: any) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 8)
      .map((r: any) => ({
        id: r.id,
        subject: r.subject,
        from: r.from_name || r.from_address,
        date: r.date,
        starred: !!r.is_starred,
        unread: !r.is_read,
        category: r.category,
      }))

    return NextResponse.json({
      total,
      unread,
      starred,
      sinceLastSeen,
      byCategory,
      topContacts,
      dailyCounts,
      importantEmails,
      now: now.toISOString(),
    })
  } catch (e) {
    console.error("Dashboard metrics error:", e)
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 })
  }
}
