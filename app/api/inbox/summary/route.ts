import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as Groq from "@/lib/groq"

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
      .select("id, thread_id, date, from_address, from_name, subject, preview")
      .eq("user_id", user.id)
      .gte("date", cutoff.toISOString())
      .order("date", { ascending: false })
      .limit(400)

    const emails = (rows || []).map((r) => ({
      from: r.from_name || r.from_address,
      subject: r.subject || "",
      preview: r.preview || "",
      date: r.date,
    }))

    const [line, moodRaw] = await Promise.all([
      (Groq as any).groqOneLinerSummary(emails),
      ((Groq as any).groqMoodWord || (Groq as any).getInboxMood)?.(emails),
    ])
    const mood = (typeof moodRaw === "string" && moodRaw) || "Normal"

    return NextResponse.json({ summary: line, mood, count: emails.length, windowHours: hours })
  } catch (e) {
    console.error("Inbox summary error:", e)
    return NextResponse.json({ summary: "Inbox looks normal – a few items need attention.", mood: "Normal" })
  }
}
