"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

// SVG Icons as components with proper props
interface IconProps {
  className?: string
  style?: React.CSSProperties
}

const SendIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
)

const HomeIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
)

const MailIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
)

const EditIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
)

const UsersIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const FolderIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
  </svg>
)

const InboxIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
)

const PlusIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const ChevronDownIcon: React.FC<IconProps> = ({ className = "", style }) => (
  <svg className={`i ${className}`} style={style} viewBox="0 0 24 24">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export function Sidebar() {
  const pathname = usePathname()
  const [isHomeOpen, setIsHomeOpen] = useState(false)
  const [isTrackMailOpen, setIsTrackMailOpen] = useState(false)

  // Sample recent conversations
  const recentConversations = [
    "Seed-stage SaaS founders",
    "Follow-ups, week 44",
    "Dev-tool angel investors",
    "Podcast guest outreach",
    "YC W26 founders intro",
  ]

  const isActive = (path: string) => pathname === path

  return (
    <aside className="side">
      {/* Logo and workspace */}
      <div className="ws">
        <span className="logo">
          <SendIcon />
        </span>
        ColdSend
        <ChevronDownIcon />
      </div>

      {/* New campaign button */}
      <button className="btn btn-secondary newchat">
        <PlusIcon />
        New campaign
      </button>

      {/* Scrollable content */}
      <div className="scroll">
        {/* Home with dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className={`nav ${isActive("/") ? "active" : ""}`}
            onClick={() => setIsHomeOpen(!isHomeOpen)}
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HomeIcon />
              Home
            </span>
            <ChevronDownIcon style={{ transform: isHomeOpen ? "rotate(180deg)" : "none" }} />
          </button>
          {isHomeOpen && (
            <div className="recent">
              {recentConversations.map((conv) => (
                <Link key={conv} href={`/?conversation=${encodeURIComponent(conv)}`} className="nav">
                  {conv}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Track Mail with dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className={`nav ${isActive("/mail") || pathname?.startsWith("/mail/") ? "active" : ""}`}
            onClick={() => setIsTrackMailOpen(!isTrackMailOpen)}
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <MailIcon />
              Track Mail
            </span>
            <ChevronDownIcon style={{ transform: isTrackMailOpen ? "rotate(180deg)" : "none" }} />
          </button>
          {isTrackMailOpen && (
            <div className="recent">
              <Link href="/mail/inbox" className="nav">
                Inbox
              </Link>
              <Link href="/mail/starred" className="nav">
                Starred
              </Link>
              <Link href="/mail/sent" className="nav">
                Sent
              </Link>
              <Link href="/mail/drafts" className="nav">
                Drafts
              </Link>
              <Link href="/mail/trash" className="nav">
                Trash
              </Link>
            </div>
          )}
        </div>

        {/* Campaigns */}
        <Link href="/campaigns" className={`nav ${isActive("/campaigns") ? "active" : ""}`}>
          Campaigns
          <span className="count">6</span>
        </Link>

        {/* Review */}
        <Link href="/review" className={`nav ${isActive("/review") ? "active" : ""}`}>
          Review
          <span className="count hot">23</span>
        </Link>

        {/* Replies */}
        <Link href="/replies" className={`nav ${isActive("/replies") ? "active" : ""}`}>
          Replies
          <span className="count">4</span>
        </Link>

        {/* Contacts */}
        <Link href="/contacts" className={`nav ${isActive("/contacts") ? "active" : ""}`}>
          Contacts
        </Link>

        {/* Context & files */}
        <Link href="/context" className={`nav ${isActive("/context") ? "active" : ""}`}>
          Context & files
        </Link>
      </div>

      {/* Usage bar */}
      <div className="usage">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Emails this month</span>
          <span className="num">212 / 500</span>
        </div>
        <div className="bar">
          <i style={{ width: "42%" }}></i>
        </div>
        <div className="me">
          <span className="av">AM</span>
          Arjun Mehta
          <ChevronDownIcon />
        </div>
      </div>
    </aside>
  )
}
