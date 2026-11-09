"use client"

import type React from "react"

import { Star, Trash2, Zap } from "lucide-react"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface Email {
  id: string
  from: string
  fromAddress?: string
  subject: string
  preview: string
  timestamp: string
  avatar: string
  category: "inbox" | "starred" | "sent" | "drafts" | "trash" | "promotions"
  unread: boolean
  starred: boolean
  isUrgent?: boolean
  hasAIInsight?: boolean
  showPreview?: boolean
}

interface EmailListItemProps {
  email: Email
  isSelected: boolean
  onSelect: () => void
  onAction: (e: React.MouseEvent, id: string, action: "archive" | "delete" | "star") => void
}

const CATEGORY_COLORS = {
  work: "bg-blue-500/10 text-blue-600",
  personal: "bg-green-500/10 text-green-600",
  promotions: "bg-orange-500/10 text-orange-600",
  updates: "bg-purple-500/10 text-purple-600",
}

const HAPTIC_FEEDBACK = {
  light: () => {
    if (navigator.vibrate) navigator.vibrate(10)
  },
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(20)
  },
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(40)
  },
}

export function EmailListItem({ email, isSelected, onSelect, onAction }: EmailListItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const startXRef = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!itemRef.current) return

    const currentX = e.touches[0].clientX
    const diff = currentX - startXRef.current

    if (Math.abs(diff) > 5) {
      setSwipeOffset(diff)

      if (Math.abs(diff) === 80) {
        HAPTIC_FEEDBACK.light()
      }
      if (Math.abs(diff) === 150) {
        HAPTIC_FEEDBACK.medium()
      }
    }
  }

  const handleTouchEnd = () => {
    setIsAnimating(true)

    if (swipeOffset < -100) {
      HAPTIC_FEEDBACK.heavy()
      const mockEvent = new MouseEvent("click", { bubbles: true })
      onAction(mockEvent as unknown as React.MouseEvent, email.id, "archive")
      setSwipeOffset(-300)
    } else if (swipeOffset > 100) {
      HAPTIC_FEEDBACK.heavy()
      const mockEvent = new MouseEvent("click", { bubbles: true })
      onAction(mockEvent as unknown as React.MouseEvent, email.id, "star")
      setSwipeOffset(300)
    } else {
      HAPTIC_FEEDBACK.light()
      setSwipeOffset(0)
    }

    setTimeout(() => setIsAnimating(false), 300)
  }

  // Sanitize potential raw values to avoid "Name <email@domain>" in the name line
  const cleanName = (email.from || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\"/g, "")
    .trim()
  const cleanAddress = email.fromAddress || (email.from?.match(/<([^>]+)>/)?.[1] ?? email.from)

  // Subtle color accents per folder (avatar chip + left accent bar)
  const chipClasses = (() => {
    switch (email.category) {
      case "inbox":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
      case "starred":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      case "sent":
        return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
      case "drafts":
        return "bg-slate-500/15 text-slate-700 dark:text-slate-300"
      case "trash":
        return "bg-red-500/15 text-red-700 dark:text-red-400"
      case "promotions":
        return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
      default:
        return "bg-muted text-foreground/80"
    }
  })()

  return (
    <div
      ref={itemRef}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "px-4 py-3 cursor-pointer overflow-hidden relative transition-all duration-100",
        "border border-border/60 rounded-xl mx-2 my-1 bg-card",
        "hover:border-border hover:bg-card/90",
        isSelected && "ring-1 ring-primary/50 border-primary/50 bg-card",
      )}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        opacity: swipeOffset !== 0 ? 1 - Math.abs(swipeOffset) / 300 : 1,
        transition: isAnimating ? "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
      }}
    >
      <div className="flex gap-3 items-start">
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold border border-border/60",
              chipClasses,
            )}
          >
            {email.avatar}
          </div>
          {email.isUrgent && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-sm truncate",
                  email.unread ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {cleanName}
              </h3>
              {email.unread && (
                <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-semibold bg-[#5B6BFF]/20 text-[#A3B0FF] border border-[#5B6BFF]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C8CFF]" />
                  Unread
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{email.timestamp}</span>
          </div>

          {/* First line under name: subject with unread weight, timestamp to the right */}

          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-sm truncate", email.unread ? "font-semibold text-foreground" : "text-foreground")}>
              {email.subject}
            </span>
            {email.starred && <Star className="w-3.5 h-3.5 text-yellow-500" />}
          </div>

          {/* Preview line like Gmail (can be hidden from Settings) */}
          {email.showPreview !== false && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{email.preview}</p>
          )}

          {/* Removed preview, timestamp, unread dot, and chips per spec */}
        </div>

        {(isHovered || isSelected) && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                HAPTIC_FEEDBACK.light()
                onAction(e, email.id, "star")
              }}
              className="p-2 hover:bg-muted rounded-md transition-colors border border-transparent hover:border-border/60"
            >
              <Star className={cn("w-4 h-4", email.starred ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
            </button>
            <button
              onClick={(e) => {
                HAPTIC_FEEDBACK.light()
                onAction(e, email.id, "delete")
              }}
              className="p-2 hover:bg-muted rounded-md transition-colors border border-transparent hover:border-border/60"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        )}
      </div>

      {/* Swipe action indicators */}
      <div className="absolute inset-0 pointer-events-none">
        {swipeOffset > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary/15 to-transparent"
            style={{ width: `${Math.min(swipeOffset, 100)}px` }}
          />
        )}
        {swipeOffset < 0 && (
          <div
            className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-destructive/15 to-transparent"
            style={{ width: `${Math.min(Math.abs(swipeOffset), 100)}px` }}
          />
        )}
      </div>
    </div>
  )
}
