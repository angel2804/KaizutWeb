import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const CreateWorkerSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  pin: z.string().min(4, 'El PIN debe tener al menos 4 caracteres'),
})

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('workers')
    .select('id, name, pin, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error al obtener trabajadores' }, { status: 500 })
  return NextResponse.json({ workers: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = CreateWorkerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('workers')
    .insert({ name: parsed.data.name, pin: parsed.data.pin })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ese PIN ya está en uso' }, { status: 409 })
    return NextResponse.json({ error: 'Error al crear trabajador' }, { status: 500 })
  }

  return NextResponse.json({ worker: data }, { status: 201 })
}
