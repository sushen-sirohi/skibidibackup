import { syncEmailsToSupabase } from "@/lib/gmail/sync"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Body options: perFolderLimit, priorityFolders
    const body = await request.json().catch(() => ({}))
    const perFolderLimit = body?.perFolderLimit
    const priorityFolders = Array.isArray(body?.priorityFolders) ? body.priorityFolders : undefined

    // Get user's Gmail tokens
    const { data: profile } = await supabase.from("profiles").select("gmail_access_token").eq("id", user.id).single()

    if (!profile?.gmail_access_token) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })
    }

    // Sync emails
    const result = await syncEmailsToSupabase(user.id, profile.gmail_access_token, {
      perFolderLimit,
      priorityFolders,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: "Failed to sync emails" }, { status: 500 })
  }
}
