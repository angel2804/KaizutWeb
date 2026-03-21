import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /dashboard routes except /dashboard/login
  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login')) {
    const workerSession = request.cookies.get('worker_session')

    if (!workerSession || workerSession.value !== 'authenticated') {
      const loginUrl = new URL('/dashboard/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
