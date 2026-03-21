import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const AddVehicleSchema = z.object({
  customer_id: z.string().uuid('ID de cliente inválido'),
  plate: z
    .string()
    .min(5, 'Placa muy corta')
    .max(10, 'Placa muy larga')
    .regex(/^[A-Z0-9-]+$/i, 'Formato de placa inválido')
    .transform((v) => v.toUpperCase()),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = AddVehicleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      customer_id: parsed.data.customer_id,
      plate: parsed.data.plate,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Esa placa ya está registrada' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al registrar vehículo' }, { status: 500 })
  }

  return NextResponse.json({ vehicle: data }, { status: 201 })
}
