"use client"

import type React from "react"

import { useRef, useState } from "react"

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  onHaptic?: (intensity: "light" | "medium" | "heavy") => void
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  onHaptic,
}: SwipeOptions) {
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY

    const diffX = currentX - startXRef.current
    const diffY = currentY - startYRef.current

    setOffset({ x: diffX, y: diffY })
  }

  const handleTouchEnd = () => {
    const { x, y } = offset

    if (Math.abs(x) > threshold && Math.abs(x) > Math.abs(y)) {
      if (x < 0) {
        onSwipeLeft?.()
        onHaptic?.("medium")
      } else {
        onSwipeRight?.()
        onHaptic?.("medium")
      }
    } else if (Math.abs(y) > threshold && Math.abs(y) > Math.abs(x)) {
      if (y < 0) {
        onSwipeUp?.()
        onHaptic?.("medium")
      } else {
        onSwipeDown?.()
        onHaptic?.("medium")
      }
    }

    setOffset({ x: 0, y: 0 })
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    offset,
  }
}
