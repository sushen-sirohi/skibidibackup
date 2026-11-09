"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Search, Archive, Trash2, Star, Clock, Tag, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = [
    {
      id: "archive",
      label: "Archive email",
      icon: <Archive className="w-4 h-4" />,
      action: () => console.log("Archive"),
      shortcut: "E",
    },
    {
      id: "delete",
      label: "Delete email",
      icon: <Trash2 className="w-4 h-4" />,
      action: () => console.log("Delete"),
      shortcut: "#",
    },
    {
      id: "star",
      label: "Star email",
      icon: <Star className="w-4 h-4" />,
      action: () => console.log("Star"),
      shortcut: "*",
    },
    {
      id: "snooze",
      label: "Snooze email",
      icon: <Clock className="w-4 h-4" />,
      action: () => console.log("Snooze"),
      shortcut: "Z",
    },
    {
      id: "label",
      label: "Add label",
      icon: <Tag className="w-4 h-4" />,
      action: () => console.log("Label"),
      shortcut: "L",
    },
  ]

  const filteredCommands = commands.filter((cmd) => cmd.label.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        filteredCommands[selectedIndex]?.action()
        onOpenChange(false)
        setSearchQuery("")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, filteredCommands, selectedIndex, onOpenChange])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-16"
      onClick={() => {
        onOpenChange(false)
        setSearchQuery("")
      }}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg overflow-hidden spring-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(0)
              }}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No commands found</div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action()
                  onOpenChange(false)
                  setSearchQuery("")
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm flex items-center justify-between border-b border-border last:border-0 transition-colors",
                  index === selectedIndex ? "bg-primary/20 text-foreground" : "text-foreground hover:bg-muted",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{cmd.icon}</div>
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded font-mono">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Help Text */}
        <div className="p-3 bg-muted/20 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>⏎ Execute</span>
            <span>ESC Close</span>
          </div>
          <button onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
