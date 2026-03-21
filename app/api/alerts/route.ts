import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('transaction_alerts')
      .select('*')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ alerts: [] })
    return NextResponse.json({ alerts: data ?? [] })
  } catch {
    return NextResponse.json({ alerts: [] })
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = await createServiceClient()

  if (body.id) {
    await supabase.from('transaction_alerts').update({ read_at: new Date().toISOString() }).eq('id', body.id)
  } else {
    await supabase.from('transaction_alerts').update({ read_at: new Date().toISOString() }).is('read_at', null)
  }

  return NextResponse.json({ success: true })
}
