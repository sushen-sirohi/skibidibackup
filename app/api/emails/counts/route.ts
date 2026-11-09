import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { refreshAccessToken } from "@/lib/gmail/auth"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Load Gmail tokens
    const { data: profile } = await supabase
      .from("profiles")
      .select("gmail_access_token, gmail_refresh_token")
      .eq("id", user.id)
      .single()

    let accessToken = profile?.gmail_access_token as string | undefined
    const refreshToken = profile?.gmail_refresh_token as string | undefined
    if (!accessToken) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })

    // Helper: Gmail labels.get -> messagesTotal (fast & accurate)
    const gmailLabelTotal = async (labelId: string, attempt = 0): Promise<number> => {
      const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/labels/${encodeURIComponent(labelId)}`)
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (resp.status === 401 && attempt === 0 && refreshToken) {
        try {
          const refreshed = await refreshAccessToken(refreshToken)
          accessToken = refreshed.access_token
          await supabase
            .from("profiles")
            .update({
              gmail_access_token: refreshed.access_token,
              gmail_refresh_token: refreshed.refresh_token || refreshToken,
            })
            .eq("id", user.id)
          return gmailLabelTotal(labelId, 1)
        } catch {
          // fallthrough
        }
      }
      if (!resp.ok) return 0
      const data = await resp.json()
      return typeof data.messagesTotal === "number" ? data.messagesTotal : 0
    }

    // Helper: messages.list resultSizeEstimate for intersections (e.g., STARRED ∩ TRASH) or categories like Primary
    const gmailListEstimate = async (
      { labels, q }: { labels?: string[]; q?: string },
      attempt = 0,
    ): Promise<number> => {
      const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages")
      url.searchParams.set("maxResults", "1")
      if (labels) labels.forEach((l) => url.searchParams.append("labelIds", l))
      if (q) url.searchParams.set("q", q)
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (resp.status === 401 && attempt === 0 && refreshToken) {
        try {
          const refreshed = await refreshAccessToken(refreshToken)
          accessToken = refreshed.access_token
          await supabase
            .from("profiles")
            .update({
              gmail_access_token: refreshed.access_token,
              gmail_refresh_token: refreshed.refresh_token || refreshToken,
            })
            .eq("id", user.id)
          return gmailListEstimate({ labels, q }, 1)
        } catch {
          // fallthrough
        }
      }
      if (!resp.ok) return 0
      const data = await resp.json()
      return typeof data.resultSizeEstimate === "number" ? data.resultSizeEstimate : 0
    }

    // Counts
    // Inbox (Primary only): use query for Primary
    const inboxP = gmailListEstimate({ q: "category:primary" })
    // Starred (excluding trash): labels total minus intersection with TRASH
    const starredAllP = gmailLabelTotal("STARRED")
    const starredTrashP = gmailListEstimate({ labels: ["STARRED", "TRASH"] })
    // System label totals
    const sentP = gmailLabelTotal("SENT")
    const draftsP = gmailLabelTotal("DRAFT")
    const trashP = gmailLabelTotal("TRASH")
    const promotionsP = gmailLabelTotal("CATEGORY_PROMOTIONS")

    const [inbox, starredAll, starredTrash, sent, drafts, trash, promotions] = await Promise.all([
      inboxP,
      starredAllP,
      starredTrashP,
      sentP,
      draftsP,
      trashP,
      promotionsP,
    ])
    const starred = Math.max(0, starredAll - starredTrash)

    return NextResponse.json({
      inbox,
      starred,
      sent,
      drafts,
      trash,
      promotions,
      marketing: promotions,
    })
  } catch (e) {
    console.error("Counts error:", e)
    return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 })
  }
}
