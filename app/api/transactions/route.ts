import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { REDEMPTION_GOALS, POINTS_PER_SOL } from '@/lib/constants'
import { z } from 'zod'

const PurchaseSchema = z.object({
  type: z.literal('purchase'),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional().nullable(),
  amount_soles: z.number().positive('El monto debe ser mayor a 0'),
  fuel_type: z.enum(['GLP', 'Premium', 'Regular', 'Bio']),
  worker_id: z.string().uuid().optional().nullable(),
})

const RedemptionSchema = z.object({
  type: z.literal('redemption'),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional().nullable(),
  fuel_type: z.enum(['GLP', 'Premium', 'Regular', 'Bio']),
  worker_id: z.string().uuid().optional().nullable(),
})

const TransactionSchema = z.discriminatedUnion('type', [PurchaseSchema, RedemptionSchema])

// GET: list transactions
// ?customer_id=UUID  → customer history (last 50)
// (no params)        → all transactions for admin (last 200)
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')

  let query = supabase
    .from('transactions')
    .select('id, type, fuel_type, amount_soles, points_earned, created_at, customer_id, worker_id, customers(full_name, dni), workers(name)')
    .order('created_at', { ascending: false })

  if (customerId) {
    query = query.eq('customer_id', customerId).limit(50)
  } else {
    query = query.limit(200)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })

  return NextResponse.json({ transactions: data ?? [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = TransactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const data = parsed.data

  if (data.type === 'purchase') {
    const pointsEarned = Math.floor(data.amount_soles * POINTS_PER_SOL)

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id ?? null,
        amount_soles: data.amount_soles,
        points_earned: pointsEarned,
        type: 'purchase',
        fuel_type: data.fuel_type,
        worker_id: data.worker_id ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error al registrar transacción' }, { status: 500 })
    }

    // Fetch updated customer points
    const { data: customer } = await supabase
      .from('customers')
      .select('total_points')
      .eq('id', data.customer_id)
      .single()

    return NextResponse.json({
      transaction,
      points_earned: pointsEarned,
      new_total_points: customer?.total_points ?? null,
    }, { status: 201 })
  }

  // Redemption — fetch live points threshold from app_settings
  const staticGoal = REDEMPTION_GOALS.find((g) => g.fuelType === data.fuel_type)
  if (!staticGoal) {
    return NextResponse.json({ error: 'Tipo de combustible inválido' }, { status: 400 })
  }

  const settingKey = `points_${data.fuel_type.toLowerCase()}`
  const { data: settingRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', settingKey)
    .maybeSingle()

  const pointsRequired = settingRow?.value ? parseInt(settingRow.value, 10) || staticGoal.pointsRequired : staticGoal.pointsRequired

  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('total_points')
    .eq('id', data.customer_id)
    .single()

  if (fetchError || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  if (customer.total_points < pointsRequired) {
    return NextResponse.json(
      { error: `Puntos insuficientes. Necesitas ${pointsRequired}, tienes ${customer.total_points}` },
      { status: 422 }
    )
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id ?? null,
      amount_soles: 0,
      points_earned: pointsRequired,
      type: 'redemption',
      fuel_type: data.fuel_type,
      worker_id: data.worker_id ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al registrar canje' }, { status: 500 })
  }

  const { data: updatedCustomer } = await supabase
    .from('customers')
    .select('total_points')
    .eq('id', data.customer_id)
    .single()

  return NextResponse.json({
    transaction,
    points_redeemed: pointsRequired,
    new_total_points: updatedCustomer?.total_points ?? null,
  }, { status: 201 })
}
