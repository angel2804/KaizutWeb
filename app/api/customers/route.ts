import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { cookies } from 'next/headers'

const CreateCustomerSchema = z.object({
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos').regex(/^\d+$/, 'Solo números'),
  full_name: z.string().min(3, 'Nombre muy corto'),
  email: z.string().email('Email inválido').or(z.literal('')).optional().nullable(),
  phone: z.string().optional().nullable(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN debe ser 4-6 dígitos numéricos').optional().nullable(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get('dni')

  if (!dni) {
    return NextResponse.json({ error: 'DNI requerido' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Check if request comes from an authenticated admin session
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  const isAdmin = session?.value === 'authenticated'

  const { data: customerRow, error } = await supabase
    .from('customers')
    .select('id, dni, full_name, email, phone, total_points, glp_points, liquid_points, pin, created_at, vehicles(*)')
    .eq('dni', dni)
    .single()

  if (error || !customerRow) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { pin, ...rest } = customerRow as typeof customerRow & { pin: string | null; vehicles: unknown[] }

  const customer = {
    ...rest,
    has_pin: pin !== null,
    // Only expose plain-text pin to authenticated admin
    ...(isAdmin && pin !== null ? { pin } : {}),
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
      pin: parsed.data.pin || null,
    })
    .select('id, dni, full_name, email, phone, total_points, glp_points, liquid_points, pin, created_at, vehicles(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un cliente con ese DNI' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }

  const { pin, ...rest } = data as typeof data & { pin: string | null; vehicles: unknown[] }
  const customer = { ...rest, has_pin: pin !== null }

  return NextResponse.json({ customer }, { status: 201 })
}
