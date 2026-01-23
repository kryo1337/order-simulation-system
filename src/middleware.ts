import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/login(.*)'])

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'akademiabialska.pl,stud.akademiabialska.pl')
  .split(',')
  .map(d => d.trim().toLowerCase())

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  if (isPublicRoute(req)) {
    if (userId) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }
  if (!userId) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const email = (sessionClaims?.email as string)?.toLowerCase() || ''

  if (email) {
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`))

    if (!isAllowedDomain) {
      console.log(`[Auth] Access denied for: ${email}`)
      return NextResponse.redirect(new URL('/login?error=domain', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
