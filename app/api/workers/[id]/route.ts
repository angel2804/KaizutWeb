import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()
  const { error } = await supabase.from('workers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Error al eliminar trabajador' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('workers')
    .update({ name: body.name, pin: body.pin })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json({ worker: data })
}
