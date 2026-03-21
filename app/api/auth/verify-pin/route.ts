import { NextRequest, NextResponse } from 'next/server'

function makeSession(maxAge = 60 * 60 * 24): NextResponse {
  const response = NextResponse.json({ success: true })
  response.cookies.set('worker_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
  return response
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // ── Path 1: username + password (admin modal login) ──────────────
  if ('username' in body || 'password' in body) {
    const { username, password } = body as { username?: string; password?: string }

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const correctUser = process.env.ADMIN_USERNAME
    const correctPass = process.env.ADMIN_PASSWORD

    if (!correctUser || !correctPass) {
      return NextResponse.json({ error: 'Configuración inválida en el servidor' }, { status: 500 })
    }

    if (username !== correctUser || password !== correctPass) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    return makeSession(60 * 60 * 24 * 7) // 7 days for admin
  }

  // ── Path 2: legacy PIN (dashboard/login page fallback) ────────────
  const { pin } = body as { pin?: string }
  if (!pin) return NextResponse.json({ error: 'PIN requerido' }, { status: 400 })

  const correctPin = process.env.DASHBOARD_PIN
  if (!correctPin) return NextResponse.json({ error: 'Configuración inválida' }, { status: 500 })
  if (pin !== correctPin) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

  return makeSession()
}
