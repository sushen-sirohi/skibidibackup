"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"

// SVG Icons
const SendIcon = () => (
  <svg className="i" viewBox="0 0 24 24">
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="i" viewBox="0 0 24 24">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
)

const UsersIcon = () => (
  <svg className="i" viewBox="0 0 24 24">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const GlobeIcon = () => (
  <svg className="i" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </svg>
)

const ClipIcon = () => (
  <svg className="i" viewBox="0 0 24 24">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const UpIcon = () => (
  <svg className="i" viewBox="0 0 24 24">
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
)

const ArrowIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`i ${className}`} viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const SearchIcon = () => (
  <svg className="i" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export function HomeAIAgent() {
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: "user" | "ai" }>>([
    {
      id: 1,
      text: "Hello! I'm ColdSend AI, your mail agent. How can I help you with your cold email campaigns today?",
      sender: "ai",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mini dashboard stats
  const stats = {
    mailsSent: 1247,
    repliesReceived: 234,
    conversionRate: 18.7,
    campaignsStarted: 24,
  }

  // Sample suggestions
  const suggestions = [
    { icon: <UsersIcon />, text: "Start a new cold email campaign to 50 prospects" },
    { icon: <SendIcon />, text: "Follow up with unanswered leads from last week" },
    { icon: <SearchIcon />, text: "Find and verify new prospect emails" },
  ]

  // Sample recent campaigns
  const recentCampaigns = [
    { name: "Seed-stage SaaS founders", status: "In review", progress: 46, opened: "—", replies: "—" },
    { name: "Dev-tool angel investors", status: "Sent", progress: 100, opened: "64%", replies: "9" },
    { name: "Podcast guest outreach", status: "Sending", progress: 72, opened: "51%", replies: "4" },
    { name: "YC W26 founders intro", status: "Sent", progress: 100, opened: "58%", replies: "12" },
  ]

  const handleSend = () => {
    if (!inputValue.trim()) return

    setIsLoading(true)
    
    // Add user message
    const userMessage = { id: messages.length + 1, text: inputValue, sender: "user" as const }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        text: `I understand you want to: "${inputValue}". Let me help you with that. I'll need a moment to process your request and provide the best approach for your cold email campaign.`,
        sender: "ai" as const,
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div style={{ display: "grid", gridTemplateColumns: "236px minmax(0, 1fr)", height: "100vh", overflow: "hidden", background: "var(--bg)", minWidth: 0 }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="main">
        {/* Top bar */}
        <div className="topbar">
          <span>Home</span>
          <span className="spacer" />
          <button className="btn btn-ghost btn-sm">
            <BuildingIcon />
            Acme Labs
          </button>
        </div>

        {/* Home content */}
        <div className="home">
          {/* Mini Dashboard */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "16px", 
            marginBottom: "32px",
            padding: "20px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "var(--text)" }}>
                {stats.mailsSent}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
                Mails Sent (AI)
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "var(--success)" }}>
                {stats.repliesReceived}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
                Replies Received
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "var(--accent)" }}>
                {stats.conversionRate}%
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
                Conversion Rate
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "var(--text)" }}>
                {stats.campaignsStarted}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
                Campaigns Started
              </div>
            </div>
          </div>

          {/* Chat messages */}
          <div 
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "400px",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  className="av"
                  style={{
                    background: msg.sender === "ai" ? "var(--accent-soft)" : "var(--surface)",
                    color: msg.sender === "ai" ? "var(--accent)" : "var(--text-2)",
                  }}
                >
                  {msg.sender === "ai" ? "AI" : "YOU"}
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: msg.sender === "ai" ? "var(--surface)" : "var(--accent-soft)",
                    borderRadius: "var(--radius)",
                    color: msg.sender === "ai" ? "var(--text)" : "var(--accent-text)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div className="av" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  AI
                </div>
                <div className="badge b-run">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="sugg">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="row"
                onClick={() => setInputValue(suggestion.text)}
                style={{ cursor: "pointer" }}
              >
                {suggestion.icon}
                {suggestion.text}
                <ArrowIcon className="arrow" />
              </button>
            ))}
          </div>

          {/* Prompt box */}
          <div className="prompt">
            <textarea
              placeholder="Tell me what you want to achieve with your cold email campaign..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <div className="prompt-bar">
              <button className="chip">
                <ClipIcon />
                Attach
              </button>
              <button className="chip">
                <UsersIcon />
                Contacts
              </button>
              <button className="chip">
                <GlobeIcon />
                Research
              </button>
              <span className="spacer" />
              <button
                className="send"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send"
              >
                <UpIcon />
              </button>
            </div>
          </div>

          {/* Recent campaigns table */}
          <div className="sec-h">
            Recent campaigns
            <Link href="/campaigns" style={{ color: "var(--text-2)", fontWeight: 400, textDecoration: "none", fontSize: "12.5px" }}>
              View all
            </Link>
          </div>
          <div className="tbl">
            <div className="tbl-h">
              <span>Campaign</span>
              <span>Progress</span>
              <span>Opened</span>
              <span>Replies</span>
              <span>Status</span>
            </div>
            {recentCampaigns.map((campaign, index) => (
              <div key={index} className="tbl-r">
                <div>
                  <div className="name">{campaign.name}</div>
                  <div className="sub">Started {index === 0 ? "today" : index === 1 ? "3 days ago" : index === 2 ? "6 days ago" : "2 weeks ago"}</div>
                </div>
                <div>
                  <div className={`bar ${campaign.progress === 100 ? "ok" : ""}`}>
                    <i style={{ width: `${campaign.progress}%` }}></i>
                  </div>
                </div>
                <span className="num">{campaign.opened}</span>
                <span className="num">{campaign.replies}</span>
                <span className={`badge ${campaign.status === "Sent" ? "b-ok" : campaign.status === "In review" ? "b-warn" : "b-run"}`}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
