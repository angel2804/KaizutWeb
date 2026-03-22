import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  if (session?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const file = searchParams.get('file')
  if (!file) {
    return NextResponse.json({ error: 'Parámetro file requerido' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase.storage
    .from('dni-photos')
    .createSignedUrl(file, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
