import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { pin } = body as { pin?: string }

  if (!pin) return NextResponse.json({ error: 'PIN requerido' }, { status: 400 })

  const supabase = await createServiceClient()
  const { data: worker, error } = await supabase
    .from('workers')
    .select('id, name')
    .eq('pin', pin)
    .eq('is_active', true)
    .single()

  if (error || !worker) {
    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  }

  return NextResponse.json({ worker })
}
