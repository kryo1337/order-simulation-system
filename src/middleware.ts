import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/login(.*)'])

// Dozwolone domeny emailowe
const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'akademiabialska.pl,stud.akademiabialska.pl')
  .split(',')
  .map(d => d.trim().toLowerCase())

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Publiczne trasy (strona logowania)
  if (isPublicRoute(req)) {
    // Zalogowany użytkownik -> przekieruj do głównej
    if (userId) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Chronione trasy - wymaga zalogowania
  if (!userId) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Walidacja domeny emaila (dodatkowe zabezpieczenie)
  const email = (sessionClaims?.email as string)?.toLowerCase() || ''

  if (email) {
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`))

    if (!isAllowedDomain) {
      // Przekieruj z błędem - domena niedozwolona
      console.log(`[Auth] Access denied for: ${email}`)
      return NextResponse.redirect(new URL('/login?error=domain', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
