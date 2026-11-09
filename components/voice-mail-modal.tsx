"use client"

import { useState, useEffect } from "react"
import { Mic, X, Send, Copy, Volume2 } from "lucide-react"

interface VoiceMailModalProps {
  open: boolean
  onClose: () => void
}

export function VoiceMailModal({ open, onClose }: VoiceMailModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [duration, setDuration] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])

  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      setDuration((d) => d + 1)
      // Simulate waveform animation
      setWaveform((prev) => [...prev.slice(-15), Math.random() * 100])
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording])

  const handleStartRecording = () => {
    setIsRecording(true)
    setTranscription("")
    setDuration(0)
    setWaveform([])
    // Simulate transcription appearing
    setTimeout(() => {
      setTranscription("Hi Sarah, I wanted to follow up on the Q4 goals we discussed...")
      setConfidence(92)
    }, 2000)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden spring-enter">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Voice to Mail</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Recording visualizer */}
          {isRecording && (
            <div className="mb-8">
              <div className="flex items-end justify-center gap-1 h-12">
                {waveform.map((height, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-full transition-all duration-100"
                    style={{ height: `${Math.max(10, height * 0.6)}%` }}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">Recording... {formatTime(duration)}</p>
            </div>
          )}

          {/* Transcription display */}
          {transcription && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Transcription</label>
                <div className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{confidence}%</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground leading-relaxed border border-border/50">
                {transcription}
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 px-3 py-2 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button className="flex-1 px-3 py-2 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Recipients field */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Send to</label>
            <input
              type="email"
              placeholder="Enter recipient email..."
              className="w-full px-4 py-2 bg-muted border-0 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
            />
          </div>

          {/* Subject field */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Subject</label>
            <input
              type="text"
              placeholder="(Auto-generated)"
              className="w-full px-4 py-2 bg-muted border-0 rounded-lg text-sm text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
            />
          </div>

          {/* Recording button */}
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-4 ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            <Mic className="w-5 h-5" />
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          {/* Send button */}
          <button className="w-full py-3 rounded-lg font-semibold text-sm bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" />
            Send Voice Mail
          </button>
        </div>

        {/* Footer tips */}
        <div className="px-6 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
          <p className="font-medium mb-1">Recording Tips:</p>
          <ul className="space-y-0.5 text-xs">
            <li>• Speak clearly and naturally</li>
            <li>• Pause between sentences for better punctuation</li>
            <li>• AI will auto-format and fix grammar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
