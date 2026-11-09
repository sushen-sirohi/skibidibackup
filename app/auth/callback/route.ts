import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectUrl = new URL("/", request.url)
  let response = NextResponse.redirect(redirectUrl)

  if (!code) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the outgoing response
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    await supabase.auth.exchangeCodeForSession(code)
    console.log("[auth/callback] session exchanged successfully")
  } catch (error) {
    console.error("[auth/callback] Supabase OAuth callback error", error)
  }

  return response
}
