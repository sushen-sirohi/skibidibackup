"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarWidgetProps {
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
}

export function CalendarWidget({ selectedDate, onDateSelect }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, () => null)

  const monthName = currentMonth.toLocaleString("default", { month: "short", year: "numeric" })

  // Mock events for demonstration
  const eventsOnDate: Record<number, number> = {
    5: 1,
    12: 2,
    15: 1,
    20: 3,
    28: 1,
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <div className="bg-sidebar-accent/50 rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={previousMonth} className="p-1 hover:bg-sidebar-accent rounded transition-colors">
          <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
        </button>
        <span className="text-xs font-semibold text-sidebar-foreground">{monthName}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-sidebar-accent rounded transition-colors">
          <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={`${day}-${i}`} className="text-center text-xs font-semibold text-sidebar-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}
        {days.map((day) => (
          <button
            key={day}
            onClick={() => onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
            className={`aspect-square rounded text-xs font-medium flex items-center justify-center relative transition-all ${
              isSelected(day)
                ? "bg-primary text-primary-foreground"
                : isToday(day)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-border"
            }`}
          >
            {day}
            {eventsOnDate[day] && (
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                {Array.from({ length: Math.min(eventsOnDate[day], 2) }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-primary rounded-full" />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="pt-2 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-muted-foreground mb-1">
            {selectedDate.toLocaleDateString("default", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <div className="space-y-1">
            <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">2 events</div>
          </div>
        </div>
      )}
    </div>
  )
}
