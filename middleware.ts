import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Run on all routes except Next internals and static assets
    "/((?!_next/|_vercel|.*\.(?:js|css|png|jpg|jpeg|gif|svg|ico|webp|txt|xml|map)$).*)",
  ],
}
