"use client"

import { AlertCircle, Lightbulb, Zap } from "lucide-react"
import { useState } from "react"

interface CategoryBannerProps {
  type: "urgent" | "suggestion" | "auto-cleanup"
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function CategoryBanner({ type, title, description, action }: CategoryBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const variants = {
    urgent: {
      bg: "bg-red-500/10 border-red-500/30",
      icon: AlertCircle,
      iconColor: "text-red-400",
      textColor: "text-red-300",
    },
    suggestion: {
      bg: "bg-blue-500/10 border-blue-500/30",
      icon: Lightbulb,
      iconColor: "text-blue-400",
      textColor: "text-blue-300",
    },
    "auto-cleanup": {
      bg: "bg-green-500/10 border-green-500/30",
      icon: Zap,
      iconColor: "text-green-400",
      textColor: "text-green-300",
    },
  }

  const variant = variants[type]
  const Icon = variant.icon

  return (
    <div className={`p-4 rounded-lg border ${variant.bg} flex items-start gap-3 mb-4`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${variant.iconColor}`} />
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-sm mb-1 ${variant.textColor}`}>{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {action && (
          <button
            onClick={action.onClick}
            className="px-2 py-1 text-xs font-medium bg-muted text-foreground rounded hover:bg-muted/80 transition-colors whitespace-nowrap"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}
