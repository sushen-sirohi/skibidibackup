import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { refreshAccessToken } from "@/lib/gmail/auth"

function decodeBase64Url(data: string): string {
  try {
    const norm = data.replace(/-/g, "+").replace(/_/g, "/")
    return Buffer.from(norm, "base64").toString("utf-8")
  } catch {
    return ""
  }
}

// Very conservative HTML sanitizer (server-side) to mitigate XSS in email bodies
// Strategy:
// - Remove dangerous tags entirely: script, style, iframe, object, embed, link, meta
// - Drop event handler attributes (on*)
// - Neutralize javascript: and data: URLs in href/src (allow only http, https, mailto; for img allow http/https)
// - Strip inline CSS (style attributes)
// Note: For bulletproof sanitization use a library like sanitize-html or DOMPurify with SSR support.
function sanitizeEmailHtml(html: string): string {
  if (!html) return ""
  let out = html
  // Remove comments
  out = out.replace(/<!--([\s\S]*?)-->/g, "")
  // Remove dangerous tags with their content
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
  // Also remove self-closing variants of dangerous tags
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/\s*>/gi, "")
  // Drop event handler attributes like onload="..."
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  // Strip style attributes
  out = out.replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  // Neutralize javascript: in href/src
  out = out.replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, ' $1="#"')
  // Neutralize data: URLs except allow data:image for inline images? We will disallow all data: for safety
  out = out.replace(/\s(href|src)\s*=\s*(["'])\s*data:[^"']*\2/gi, ' $1="#"')
  // Allow only http/https/mailto for href
  out = out.replace(/\shref\s*=\s*(["'])(?!https?:|mailto:)[^"']*\1/gi, ' href="#"')
  // Allow only http/https for img src
  out = out.replace(/\ssrc\s*=\s*(["'])(?!https?:)[^"']*\1/gi, ' src="#"')
  return out
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params

    // Load email row for Gmail id
    const { data: emailRow, error: fetchErr } = await supabase
      .from("emails")
      .select("id, gmail_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    if (fetchErr || !emailRow) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    // Get Gmail access token
    const { data: profile } = await supabase
      .from("profiles")
      .select("gmail_access_token")
      .eq("id", user.id)
      .single()
    const accessToken = profile?.gmail_access_token
    if (!accessToken) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })

    // Move to trash in Gmail via trash endpoint
    const trashResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailRow.gmail_id}/trash`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    if (!trashResp.ok) {
      const t = await trashResp.text()
      return NextResponse.json({ error: "Failed to trash in Gmail", details: t }, { status: 500 })
    }

    // Update cache category to trash
    const { error: updErr } = await supabase
      .from("emails")
      .update({ category: "trash" })
      .eq("id", id)
      .eq("user_id", user.id)
    if (updErr) return NextResponse.json({ error: "Failed to update cache" }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete email error:", e)
    return NextResponse.json({ error: "Failed to delete email" }, { status: 500 })
  }
}

function extractBodyFromRaw(raw: any): { html?: string; text?: string } {
  if (!raw) return {}
  const payload = raw.payload || raw

  const stack: any[] = []
  if (payload) stack.push(payload)

  let html: string | undefined
  let text: string | undefined

  while (stack.length) {
    const node = stack.pop()
    if (!node) continue

    // Body at this node
    if (node.body?.data) {
      const content = decodeBase64Url(node.body.data)
      const mime = node.mimeType || node.headers?.find((h: any) => h.name?.toLowerCase() === "content-type")?.value
      if (!mime || /text\/html/i.test(mime)) {
        html = html ?? content
      } else if (/text\/plain/i.test(mime)) {
        text = text ?? content
      }
    }

    // Traverse parts
    if (Array.isArray(node.parts)) {
      for (const p of node.parts) stack.push(p)
    }
  }

  return { html, text }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Unwrap params (Next.js passes params as a Promise in App Router route handlers)
    const { id } = await context.params

    const { data, error } = await supabase
      .from("emails")
      .select(
        "id, user_id, gmail_id, thread_id, from_address, from_name, subject, preview, body, date, is_read, is_starred, is_archived, category, labels, raw_data",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Derive body from raw_data if present; otherwise fetch from Gmail and cache
    let body = data.body as string | null
    if (!body) {
      if (data.raw_data) {
        const derived = extractBodyFromRaw(data.raw_data)
        body = derived.html ? sanitizeEmailHtml(derived.html) : derived.text || null
      }
      if (!body && data.gmail_id) {
        // Fetch full message from Gmail
        const { data: profile } = await supabase
          .from("profiles")
          .select("gmail_access_token, gmail_refresh_token")
          .eq("id", user.id)
          .single()

        let accessToken = profile?.gmail_access_token as string | undefined
        const refreshToken = profile?.gmail_refresh_token as string | undefined
        if (accessToken) {
          const fetchFull = async () => {
            const resp = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/messages/${data.gmail_id}?format=full`,
              { headers: { Authorization: `Bearer ${accessToken}` } },
            )
            return resp
          }
          let resp = await fetchFull()
          if (resp.status === 401 && refreshToken) {
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
              resp = await fetchFull()
            } catch {}
          }
          if (resp.ok) {
            const full = await resp.json()
            const derived = extractBodyFromRaw(full)
            body = derived.html ? sanitizeEmailHtml(derived.html) : derived.text || null
            if (body) {
              // Cache the body for faster subsequent opens
              await supabase
                .from("emails")
                .update({ body })
                .eq("id", data.id)
                .eq("user_id", user.id)
            }
          }
        }
      }
    }

    return NextResponse.json({ ...data, body })
  } catch (e) {
    console.error("Email fetch error:", e)
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { is_read } = await request.json().catch(() => ({}))
    if (typeof is_read !== "boolean") {
      return NextResponse.json({ error: "Missing is_read boolean" }, { status: 400 })
    }

    const { id } = await context.params

    const { data: emailRow, error: emailErr } = await supabase
      .from("emails")
      .select("id, gmail_id, is_read")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    if (emailErr || !emailRow) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    // If already at desired state, no-op but still return ok
    if (emailRow.is_read === is_read) {
      return NextResponse.json({ ok: true, is_read })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("gmail_access_token, gmail_refresh_token")
      .eq("id", user.id)
      .single()

    let gmailSynced = false
    let gmailError: string | undefined

    if (profile?.gmail_access_token) {
      let accessToken = profile.gmail_access_token as string
      const refreshToken = profile.gmail_refresh_token as string | undefined

      const modifyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailRow.gmail_id}/modify`
      const body = is_read ? { removeLabelIds: ["UNREAD"] } : { addLabelIds: ["UNREAD"] }

      const doModify = async (token: string) =>
        fetch(modifyUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })

      let gmResp = await doModify(accessToken)
      if (gmResp.status === 401 && refreshToken) {
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
          gmResp = await doModify(accessToken)
        } catch (err) {
          console.error("Refresh token failed on mark read:", err)
        }
      }

      if (gmResp.ok) {
        gmailSynced = true
      } else {
        gmailError = await gmResp.text().catch(() => "Gmail modify failed")
      }
    }

    const { error: updErr } = await supabase
      .from("emails")
      .update({ is_read })
      .eq("id", id)
      .eq("user_id", user.id)
    if (updErr) return NextResponse.json({ error: "Failed to update cache" }, { status: 500 })

    return NextResponse.json({ ok: true, is_read, gmailSynced: gmailSynced || false, gmailError })
  } catch (e) {
    console.error("Email mark-read error:", e)
    return NextResponse.json({ error: "Failed to update read state" }, { status: 500 })
  }
}
