import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

const ALLOWED_KEYS = [
  'whatsapp_number',
  'company_name',
  'points_glp',
  'points_premium',
  'points_regular',
  'points_bio',
]

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')

  if (error) {
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }

  const settings: Record<string, string> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }

  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json() as Record<string, string>
  const upserts = Object.entries(body)
    .filter(([key]) => ALLOWED_KEYS.includes(key))
    .map(([key, value]) => ({ key, value: String(value) }))

  if (upserts.length === 0) {
    return NextResponse.json({ error: 'Sin datos válidos' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert(upserts, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })

  return NextResponse.json({ success: true })
}
