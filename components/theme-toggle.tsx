"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialDark = stored ? stored === "dark" : prefersDark
    setDark(initialDark)
    document.documentElement.classList.toggle("dark", initialDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light" : "Switch to dark"}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md border border-sidebar-border text-sidebar-foreground hover:bg-secondary transition-colors"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{dark ? "Light mode" : "Dark mode"}</span>
    </button>
  )
}
