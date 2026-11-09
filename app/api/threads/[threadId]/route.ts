import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sanitizeEmailHtml(html: string): string {
  if (!html) return ""
  let out = html
  out = out.replace(/<!--([\s\S]*?)-->/g, "")
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/\s*>/gi, "")
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  out = out.replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  out = out.replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, ' $1="#"')
  out = out.replace(/\s(href|src)\s*=\s*(["'])\s*data:[^"']*\2/gi, ' $1="#"')
  out = out.replace(/\shref\s*=\s*(["'])(?!https?:|mailto:)[^"']*\1/gi, ' href="#"')
  out = out.replace(/\ssrc\s*=\s*(["'])(?!https?:)[^"']*\1/gi, ' src="#"')
  return out
}

export async function GET(_request: NextRequest, context: { params: Promise<{ threadId: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { threadId } = await context.params

    const { data: rows, error } = await supabase
      .from("emails")
      .select(
        "id, user_id, gmail_id, thread_id, from_address, from_name, subject, preview, body, date, is_read, is_starred, is_archived, category, labels",
      )
      .eq("user_id", user.id)
      .eq("thread_id", threadId)
      .order("date", { ascending: true })

    if (error) throw error

    const messages = (rows || []).map((m) => {
      const body = typeof m.body === "string" && /<\w+[^>]*>/.test(m.body) ? sanitizeEmailHtml(m.body) : m.body
      return { ...m, body }
    })

    return NextResponse.json({ messages })
  } catch (e) {
    console.error("Thread fetch error:", e)
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 })
  }
}
