"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface ParticleBurstProps {
  x: number
  y: number
}

interface Particle {
  id: number
  x: number
  y: number
  tx: number
  ty: number
  size: number
}

export function ParticleBurst({ x, y }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const particleCount = 12
    const newParticles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const velocity = 40 + Math.random() * 60
      const distance = 80 + Math.random() * 120

      newParticles.push({
        id: i,
        x,
        y,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        size: 4 + Math.random() * 8,
      })
    }

    setParticles(newParticles)
  }, [x, y])

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle fixed pointer-events-none"
          style={
            {
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              "--tx": `${particle.tx}px`,
              "--ty": `${particle.ty}px`,
            } as React.CSSProperties & { "--tx": string; "--ty": string }
          }
        >
          <div
            className="bg-primary rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          />
        </div>
      ))}
    </>
  )
}
