export async function groqOneLinerSummary(emails: Array<{ from: string; subject: string; preview?: string; date: string }>) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY
  if (!apiKey) {
    const count = emails.length
    return count === 0 ? "Inbox is calm – nothing urgent." : `${count} recent emails – check the latest few, most can wait.`
  }
  try {
    const prompt = `Look at my last 48 hours of email. In one calm sentence tell me the actual state of my inbox.\nExamples:\n- "You're waiting on 3 people, 1 invoice due Friday, rest is noise"\n- "Inbox is dead today – nothing needs you"\n- "5 hot threads going, jump in"\nJust output the sentence, no labels.\n\nMessages (JSON): ${JSON.stringify(
      emails.slice(0, 200),
    )}`

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-8b-instant",
        messages: [
          { role: "system", content: "You are a concise inbox summarizer." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 60,
      }),
    })
    const data = await resp.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    return text || "Inbox looks normal – a few items need attention."
  } catch {
    return "Inbox looks normal – a few items need attention."
  }
}

export async function groqMoodWord(emails: Array<{ from: string; subject: string; preview?: string; date: string }>) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY
  if (!apiKey) return "Normal"
  try {
    const prompt = `Rate my inbox urgency right now: Calm / Normal / Spicy / On Fire or add your own inferences Only output the single word.\nMessages (JSON): ${JSON.stringify(
      emails.slice(0, 200),
    )}`
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You answer with a single word only." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 4,
      }),
    })
    const data = await resp.json()
    return (data?.choices?.[0]?.message?.content || "Normal").trim()
  } catch {
    return "Normal"
  }
}
