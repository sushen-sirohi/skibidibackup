import useSWR from "swr"

export interface Email {
  id: string
  gmail_id: string
  thread_id?: string
  from_address: string
  from_name?: string
  subject: string
  preview: string
  date: string
  is_read: boolean
  is_starred: boolean
  category: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useEmails(category = "inbox") {
  const { data, error, isLoading, mutate } = useSWR<Email[]>(`/api/emails?category=${category}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  })

  return {
    emails: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate,
  }
}

export async function syncEmails() {
  const response = await fetch("/api/emails/sync", { method: "POST" })
  if (!response.ok) throw new Error("Failed to sync emails")
  return response.json()
}
