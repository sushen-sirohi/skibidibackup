import { createClient } from "@/lib/supabase/server"
import { refreshAccessToken } from "@/lib/gmail/auth"

async function fetchGmailEmailsOnce(accessToken: string, maxResults = 100, pageToken?: string, q?: string) {
  const url = new URL(`https://www.googleapis.com/gmail/v1/users/me/messages`)
  url.searchParams.set("maxResults", String(maxResults))
  if (pageToken) url.searchParams.set("pageToken", pageToken)
  if (q) url.searchParams.set("q", q)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  return response
}

export async function getGmailMessage(messageId: string, accessToken: string) {
  const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error("Failed to fetch Gmail message")
  return response.json()
}

async function getGmailMessageMetadata(messageId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok) throw new Error("Failed to fetch Gmail message metadata")
  return response.json()
}

type FolderId = "inbox" | "starred" | "sent" | "drafts" | "trash" | "promotions"

interface SyncOptions {
  perFolderLimit?: number
  priorityFolders?: FolderId[]
}

export async function syncEmailsToSupabase(userId: string, accessToken: string, options: SyncOptions = {}) {
  const supabase = await createClient()

  try {
    // Ensure token valid; refresh if needed
    let tokenToUse = accessToken
    const probe = await fetchGmailEmailsOnce(tokenToUse, 1)
    if (probe.status === 401) {
      // Attempt refresh using stored refresh token
      const { data: profile } = await supabase
        .from("profiles")
        .select("gmail_refresh_token")
        .eq("id", userId)
        .single()

      const refreshToken = profile?.gmail_refresh_token
      if (!refreshToken) throw new Error("Missing Gmail refresh token")

      const refreshed = await refreshAccessToken(refreshToken)
      tokenToUse = refreshed.access_token

      // Persist new access token (and new refresh if present)
      await supabase
        .from("profiles")
        .update({
          gmail_access_token: refreshed.access_token,
          gmail_refresh_token: refreshed.refresh_token || profile.gmail_refresh_token,
        })
        .eq("id", userId)
    }

    const perFolderLimit = Math.max(1, Math.min(options.perFolderLimit ?? 20, 50))

    // Fetch latest N for each folder via Gmail queries
    const baseFolders: Array<{ id: FolderId; q: string }> = [
      { id: "inbox", q: "category:primary" },
      { id: "starred", q: "is:starred -in:trash" },
      { id: "sent", q: "in:sent" },
      { id: "drafts", q: "in:drafts" },
      { id: "trash", q: "in:trash" },
      { id: "promotions", q: "category:promotions" },
    ]

    // Reorder folders to prioritize currently visible ones
    const prioritySet = new Set(options.priorityFolders || [])
    const folders = [
      ...baseFolders.filter((f) => prioritySet.has(f.id)),
      ...baseFolders.filter((f) => !prioritySet.has(f.id)),
    ]

    // Preload existing gmail_ids to skip already cached messages
    const { data: existingRows } = await supabase
      .from("emails")
      .select("gmail_id")
      .eq("user_id", userId)
    const existingSet = new Set<string>((existingRows || []).map((r: any) => r.gmail_id))

    // Simple concurrency limiter for per-folder metadata fetches
    const runWithLimit = async <T,>(tasks: Array<() => Promise<T>>, limit = 8) => {
      const results: T[] = []
      let i = 0
      const workers = Array.from({ length: Math.min(limit, tasks.length) }).map(async () => {
        while (i < tasks.length) {
          const idx = i++
          results[idx] = await tasks[idx]()
        }
      })
      await Promise.all(workers)
      return results
    }

    let total = 0
    for (const folder of folders) {
      const listResp = await fetchGmailEmailsOnce(tokenToUse, perFolderLimit, undefined, folder.q)
      if (!listResp.ok) continue
      const listData = await listResp.json()
      const ids: string[] = (listData.messages || []).map((m: any) => m.id)
      const toFetch = ids.filter((id) => !existingSet.has(id))

      const tasks = toFetch.map((id) => async () => {
        const meta = await getGmailMessageMetadata(id, tokenToUse)
        const headers = meta.payload.headers
        const fromRaw = headers.find((h: any) => h.name === "From")?.value || ""
        // Parse From header like: "Name" <email@domain> or Name <email@domain> or email@domain
        let parsedName = ""
        let parsedEmail = ""
        const m = fromRaw.match(/(?:\"([^\"]+)\"|([^<\"]+))?\s*<([^>]+)>/)
        if (m) {
          parsedName = (m[1] || m[2] || "").trim()
          parsedEmail = m[3].trim()
        } else {
          // fallback: if only email is present
          parsedEmail = fromRaw.trim()
          parsedName = parsedEmail.split("@")[0]
        }

        const labelIds: string[] = meta.labelIds || []
        const isStarred = labelIds.includes("STARRED") || false
        const isArchived = !labelIds.includes("INBOX")

        const emailData = {
          user_id: userId,
          gmail_id: id,
          thread_id: meta.threadId,
          from_address: parsedEmail,
          from_name: parsedName,
          subject: headers.find((h: any) => h.name === "Subject")?.value || "",
          date: new Date(Number.parseInt(meta.internalDate)).toISOString(),
          preview: meta.snippet,
          is_read: !labelIds.includes("UNREAD"),
          is_starred: isStarred,
          is_archived: isArchived,
          category: folder.id,
          raw_data: null,
        }

        await supabase.from("emails").upsert(emailData, { onConflict: "user_id,gmail_id" })
        total += 1
      })

      await runWithLimit(tasks, 8)
    }

    // Update sync status
    await supabase.from("profiles").update({ last_sync: new Date().toISOString() }).eq("id", userId)

    return { success: true, count: total }
  } catch (error) {
    console.error("Sync error:", error)
    throw error
  }
}
