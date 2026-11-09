"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { EmailListContainer } from "@/components/email-list-container"
import { EmailDetailView } from "@/components/email-detail-view"

export function InboxLayout() {
  const pathname = usePathname()
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Extract category from pathname (e.g., /mail/inbox -> inbox)
  const category = pathname?.split("/").pop() || "inbox"

  const handleSelectEmail = (emailId: string, threadId?: string) => {
    setSelectedEmailId(emailId)
    setSelectedThreadId(threadId || null)
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "236px minmax(0, 1fr)", height: "100vh", overflow: "hidden", background: "var(--bg)", minWidth: 0 }}>
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <span>Track Mail</span>
          <span className="spacer" />
        </div>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "14px",
            }}
          />
        </div>
        <div style={{ display: "flex", minHeight: "0", minWidth: "0", flex: 1 }}>
          <EmailListContainer
            searchQuery={searchQuery}
            selectedEmailId={selectedEmailId}
            onSelectEmail={handleSelectEmail}
            category={category}
          />
          {selectedEmailId && (
            <EmailDetailView
              emailId={selectedEmailId}
              threadId={selectedThreadId || undefined}
              onClose={() => {
                setSelectedEmailId(null)
                setSelectedThreadId(null)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
