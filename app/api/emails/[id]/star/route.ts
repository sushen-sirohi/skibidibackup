import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { refreshAccessToken } from "@/lib/gmail/auth"

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params

    // Load email and user profile tokens
    const { data: emailRow, error: emailErr } = await supabase
      .from("emails")
      .select("id, gmail_id, is_starred")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    if (emailErr || !emailRow) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("gmail_access_token, gmail_refresh_token")
      .eq("id", user.id)
      .single()

    let accessToken = profile?.gmail_access_token as string | undefined
    if (!accessToken) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })

    // Toggle star in Gmail
    const modifyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailRow.gmail_id}/modify`
    const body = emailRow.is_starred
      ? { removeLabelIds: ["STARRED"] }
      : { addLabelIds: ["STARRED"] }

    let gmResp = await fetch(modifyUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    // If unauthorized, try refresh and retry once
    if (gmResp.status === 401 && profile?.gmail_refresh_token) {
      try {
        const refreshed = await refreshAccessToken(profile.gmail_refresh_token)
        accessToken = refreshed.access_token
        await supabase
          .from("profiles")
          .update({
            gmail_access_token: refreshed.access_token,
            gmail_refresh_token: refreshed.refresh_token || profile.gmail_refresh_token,
          })
          .eq("id", user.id)
        gmResp = await fetch(modifyUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
      } catch (e) {
        // fallthrough to error handling
      }
    }

    if (!gmResp.ok) {
      const t = await gmResp.text()
      return NextResponse.json({ error: "Failed to update Gmail star", details: t }, { status: 500 })
    }

    // Update cache
    const { error: updErr } = await supabase
      .from("emails")
      .update({ is_starred: !emailRow.is_starred })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updErr) return NextResponse.json({ error: "Failed to update cache" }, { status: 500 })

    return NextResponse.json({ ok: true, starred: !emailRow.is_starred })
  } catch (e) {
    console.error("Star error:", e)
    return NextResponse.json({ error: "Failed to toggle star" }, { status: 500 })
  }
}
