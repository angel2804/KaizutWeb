import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const CreateCustomerSchema = z.object({
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos').regex(/^\d+$/, 'Solo números'),
  full_name: z.string().min(3, 'Nombre muy corto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get('dni')

  if (!dni) {
    return NextResponse.json({ error: 'DNI requerido' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, vehicles(*)')
    .eq('dni', dni)
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ customer })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = CreateCustomerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('customers')
    .insert({
      dni: parsed.data.dni,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    })
    .select('*, vehicles(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un cliente con ese DNI' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }

  return NextResponse.json({ customer: data }, { status: 201 })
}
