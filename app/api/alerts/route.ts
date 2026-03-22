import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createServiceClient()
    // Try with read_at filter first; fall back to all alerts if column doesn't exist
    let { data, error } = await supabase
      .from('transaction_alerts')
      .select('*')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // read_at column may not exist — fetch all alerts
      const fallback = await supabase
        .from('transaction_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      data = fallback.data
    }

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
    // Fetch the alert first to check for a DNI photo
    const { data: alert } = await supabase
      .from('transaction_alerts')
      .select('alert_type, reason')
      .eq('id', body.id)
      .maybeSingle()

    if (alert?.alert_type === 'pin_self_reset' && alert.reason?.startsWith('Foto DNI:')) {
      const storedUrl = alert.reason.replace('Foto DNI: ', '')
      const filename = storedUrl.split('/').pop()
      if (filename) {
        await supabase.storage.from('dni-photos').remove([filename])
      }
    }

    await supabase.from('transaction_alerts').update({ read_at: new Date().toISOString() }).eq('id', body.id)
  } else {
    // Mark all as read — also delete any DNI photos from unread pin_self_reset alerts
    const { data: unread } = await supabase
      .from('transaction_alerts')
      .select('alert_type, reason')
      .is('read_at', null)

    const filenames = (unread ?? [])
      .filter(a => a.alert_type === 'pin_self_reset' && a.reason?.startsWith('Foto DNI:'))
      .map(a => (a.reason as string).replace('Foto DNI: ', '').split('/').pop())
      .filter((f): f is string => !!f)

    if (filenames.length > 0) {
      await supabase.storage.from('dni-photos').remove(filenames)
    }

    await supabase.from('transaction_alerts').update({ read_at: new Date().toISOString() }).is('read_at', null)
  }

  return NextResponse.json({ success: true })
}
