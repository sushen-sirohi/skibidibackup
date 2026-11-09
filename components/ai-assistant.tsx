"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEmails } from "@/lib/hooks/use-emails"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hey! I'm your SuperArc assistant. I can help you draft emails, summarize conversations, find important messages, and more. What can I do for you?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { emails } = useEmails("inbox")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const emailContext = emails
      .slice(0, 5)
      .map((e) => `${e.subject} from ${e.from_address}`)
      .join(", ")

    // Simulate AI response with email context
    setTimeout(() => {
      const userQuery = input.toLowerCase()
      let responseText = ""

      if (userQuery.includes("summarize") || userQuery.includes("summary")) {
        responseText = `Here's a summary of your recent emails: ${emailContext || "No recent emails"}. What else can I help with?`
      } else if (userQuery.includes("urgent") || userQuery.includes("important")) {
        responseText =
          "Let me find your most important emails... I can see you have several unread emails. Would you like me to prioritize them?"
      } else if (userQuery.includes("draft") || userQuery.includes("write")) {
        responseText = "I can help you draft an email! What should it be about, and who should it go to?"
      } else if (userQuery.includes("search") || userQuery.includes("find")) {
        responseText = `Based on your inbox, I found ${emails.length} relevant emails. What specific topic are you looking for?`
      } else {
        responseText =
          "I'm here to help! You can ask me to summarize emails, find specific messages, draft new ones, or manage your inbox smartly. What would you like?"
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: responseText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 800)
  }

  return (
    <>
      {isOpen && (
        <div className="absolute bottom-20 right-6 w-96 bg-card border border-border rounded-2xl shadow-lg flex flex-col h-96 spring-enter">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full glow-pulse" />
              <h3 className="font-semibold text-sm">SuperArc Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.type === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-xs px-4 py-2 rounded-xl text-sm leading-relaxed",
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-2 rounded-xl rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-muted border-0 rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all spring-enter",
          isOpen
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:shadow-lg hover:scale-105 glow-pulse",
        )}
      >
        <Sparkles className="w-5 h-5" />
      </button>
    </>
  )
}
