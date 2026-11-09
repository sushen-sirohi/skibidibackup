import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isToday(d: Date) {
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const hours = Number(url.searchParams.get("windowHours") || 48)
    const now = new Date()
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: rows } = await supabase
      .from("emails")
      .select("id, thread_id, category, date, from_address, from_name, subject, preview, is_read, is_starred")
      .eq("user_id", user.id)

    const items = (rows || [])
    const byThread: Record<string, any[]> = {}
    for (const r of items) {
      const key = r.thread_id || r.id
      ;(byThread[key] ||= []).push(r)
    }

    const groups = Object.entries(byThread).map(([key, arr]) => {
      const sorted = arr.slice().sort((a, b) => +new Date(b.date) - +new Date(a.date))
      const latest = sorted[0]
      const unreadCount = arr.filter((m) => !m.is_read).length
      const starred = arr.some((m) => m.is_starred)
      const replies48 = arr.filter((m) => new Date(m.date) >= cutoff).length
      return { key, latest, arr, unreadCount, starred, replies48 }
    })

    // Helper predicates
    const isIncoming = (g: any) => g.latest.category !== "sent" && g.latest.from_address.toLowerCase() !== (user.email || "").toLowerCase()
    const isOutgoing = (g: any) => g.latest.category === "sent" || g.latest.from_address.toLowerCase() === (user.email || "").toLowerCase()

    const actionKw = /approve|invoice|due|payment|meeting|schedule|review|confirm|contract|budget|proposal|deadline/i

    const rightNow = groups
      .filter((g) => new Date(g.latest.date) >= cutoff && isIncoming(g) && (g.unreadCount > 0 || actionKw.test(`${g.latest.subject} ${g.latest.preview}`)))
      .slice(0, 8)
      .map((g) => ({
        threadId: g.key,
        emailId: g.latest.id,
        from: g.latest.from_name || g.latest.from_address,
        subject: g.latest.subject,
        preview: g.latest.preview || "",
        unreadCount: g.unreadCount,
        date: g.latest.date,
      }))

    const waitingOnYou = groups
      .filter((g) => new Date(g.latest.date) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) && isOutgoing(g))
      .slice(0, 8)
      .map((g) => ({
        threadId: g.key,
        emailId: g.latest.id,
        to: g.latest.from_name || g.latest.from_address,
        subject: g.latest.subject,
        preview: g.latest.preview || "",
        unreadCount: g.unreadCount,
        date: g.latest.date,
      }))

    const today = groups
      .filter((g) => isToday(new Date(g.latest.date)))
      .slice(0, 12)
      .map((g) => ({ threadId: g.key, emailId: g.latest.id, from: g.latest.from_name || g.latest.from_address, subject: g.latest.subject, preview: g.latest.preview || "", unreadCount: g.unreadCount, date: g.latest.date }))

    const hot = groups
      .filter((g) => g.starred || g.replies48 >= 3)
      .slice(0, 10)
      .map((g) => ({ threadId: g.key, emailId: g.latest.id, from: g.latest.from_name || g.latest.from_address, subject: g.latest.subject, preview: g.latest.preview || "", unreadCount: g.unreadCount, date: g.latest.date }))

    const promotionsCount = items.filter((m) => m.category === "promotions").length

    return NextResponse.json({ rightNow, waitingOnYou, today, hot, promotionsCount, now: now.toISOString(), counts: { rightNow: rightNow.length, waitingOnYou: waitingOnYou.length } })
  } catch (e) {
    console.error("Inbox overview error:", e)
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 })
  }
}
