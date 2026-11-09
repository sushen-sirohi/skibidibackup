import { exchangeCodeForToken } from "@/lib/gmail/auth"
import { syncEmailsToSupabase } from "@/lib/gmail/sync"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(code)

    // Store tokens in Supabase
    await supabase
      .from("profiles")
      .update({
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token || undefined,
        gmail_connected: true,
      })
      .eq("id", user.id)

    // Kick off a background sync (best-effort)
    try {
      await syncEmailsToSupabase(user.id, tokens.access_token)
    } catch (e) {
      console.error("Background sync after Gmail connect failed:", e)
    }

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.json({ error: "Failed to process OAuth callback" }, { status: 500 })
  }
}
