import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "@/components/globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })
const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SuperArc Mail",
  description: "Insanely fast mail app with superhuman performance, smart categorization, and voice-to-mail",
  generator: "",
  icons: {
    icon: [
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
    apple: "/logo.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAFAFA",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <body className={`font-sans antialiased`} style={{ 
        margin: 0, 
        padding: 0, 
        minHeight: "100vh",
        background: "var(--bg, #121211)",
        color: "var(--text, #F5F5F4)"
      }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
