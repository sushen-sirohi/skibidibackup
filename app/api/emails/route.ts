import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "inbox"
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Build base query
    let query = supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(limit)

    // Special handling for starred
    if (category === "starred") {
      query = query.eq("is_starred", true).neq("category", "trash")
    } else {
      query = query.eq("category", category)
    }

    // Fetch cached emails from Supabase
    const { data: emails, error } = await query

    if (error) throw error

    return NextResponse.json(emails)
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
