"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type ThemeMode = "light" | "dark" | "system"

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const body = document.body
  const setDark = (on: boolean) => {
    if (on) {
      root.classList.add("dark")
      body.classList.add("dark")
    } else {
      root.classList.remove("dark")
      body.classList.remove("dark")
    }
  }
  if (mode === "system") {
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    setDark(mql.matches)
  } else if (mode === "dark") {
    setDark(true)
  } else {
    setDark(false)
  }
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [theme, setTheme] = useState<ThemeMode>("system")
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable")
  const [showPreview, setShowPreview] = useState(true)

  // Load saved prefs
  useEffect(() => {
    try {
      const t = (localStorage.getItem("theme") as ThemeMode) || "system"
      setTheme(t)
      applyTheme(t)
      const d = (localStorage.getItem("density") as "comfortable" | "compact") || "comfortable"
      setDensity(d)
      const p = localStorage.getItem("preview")
      setShowPreview(p === null ? true : p === "true")
    } catch {}
  }, [])

  // System theme listener when in system mode
  useEffect(() => {
    if (theme !== "system") return
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [theme])

  const setThemeAndPersist = (t: ThemeMode) => {
    setTheme(t)
    localStorage.setItem("theme", t)
    applyTheme(t)
    window.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme: t } }))
  }

  const setDensityAndPersist = (d: "comfortable" | "compact") => {
    setDensity(d)
    localStorage.setItem("density", d)
    document.documentElement.style.setProperty("--radius", d === "compact" ? "0.4rem" : "0.5rem")
    window.dispatchEvent(new CustomEvent("settings:update", { detail: { density: d } }))
  }

  const setPreviewAndPersist = (val: boolean) => {
    setShowPreview(val)
    localStorage.setItem("preview", String(val))
    window.dispatchEvent(new CustomEvent("settings:update", { detail: { preview: val } }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg border bg-card">
        <DialogHeader>
          <DialogTitle className="text-base">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <section>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
                { id: "system", label: "System" },
              ] as Array<{ id: ThemeMode; label: string }>).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setThemeAndPersist(opt.id)}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${
                    theme === opt.id
                      ? "bg-white dark:bg-neutral-900 border-[#E5E7EB] dark:border-neutral-800 text-[#111827] dark:text-neutral-100"
                      : "border-transparent bg-muted/40 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Density</div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "comfortable", label: "Comfortable" },
                { id: "compact", label: "Compact" },
              ] as Array<{ id: "comfortable" | "compact"; label: string }>).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDensityAndPersist(opt.id)}
                  className={`px-3 py-2 rounded-lg text-sm border transition ${
                    density === opt.id
                      ? "bg-white dark:bg-neutral-900 border-[#E5E7EB] dark:border-neutral-800 text-[#111827] dark:text-neutral-100"
                      : "border-transparent bg-muted/40 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Mail</div>
            <label className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <span className="text-sm">Show preview line in list</span>
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setPreviewAndPersist(e.target.checked)}
                className="h-4 w-4"
              />
            </label>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
