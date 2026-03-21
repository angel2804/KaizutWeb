import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
  }

  if (file.size > 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no debe superar 1 MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'company_logo_url', value: dataUrl }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: 'Error al guardar logo: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ url: dataUrl })
}
