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

  const ext = file.name.split('.').pop() ?? 'png'
  const fileName = `company-logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = await createServiceClient()

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Error al subir imagen: ' + uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName)

  // Store URL in app_settings
  await supabase
    .from('app_settings')
    .upsert({ key: 'company_logo_url', value: publicUrl }, { onConflict: 'key' })

  return NextResponse.json({ url: publicUrl })
}
