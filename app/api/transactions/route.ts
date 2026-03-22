import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { REDEMPTION_GOALS, POINTS_PER_SOL } from '@/lib/constants'
import { z } from 'zod'
import { checkRateLimit, recordFailure, resetAttempts } from '@/lib/pin-rate-limit'
import { cookies } from 'next/headers'

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
  pin: z.string().optional(),
})

const AnnulmentSchema = z.object({
  type: z.literal('annulment'),
  customer_id: z.string().uuid(),
  fuel_type: z.enum(['GLP', 'Premium', 'Regular', 'Bio']),
  points_to_remove: z.number().int().positive(),
  notes: z.string().min(1, 'El motivo es obligatorio'),
})

const TransactionSchema = z.discriminatedUnion('type', [PurchaseSchema, RedemptionSchema, AnnulmentSchema])

const GLP_FUELS = ['GLP'] as const
const LIQUID_FUELS = ['Premium', 'Regular', 'Bio'] as const

// GET: list transactions
// ?customer_id=UUID  → customer history (last 50)
// (no params)        → all transactions for admin (last 200)
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')

  let query = supabase
    .from('transactions')
    .select('id, type, fuel_type, amount_soles, points_earned, notes, created_at, customer_id, worker_id, customers(full_name, dni), workers(name)')
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

  // ─── ANNULMENT (admin only) ───────────────────────────────────────────────
  if (data.type === 'annulment') {
    const cookieStore = await cookies()
    const session = cookieStore.get('worker_session')
    if (session?.value !== 'authenticated') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verify customer has enough points in the requested pool
    const { data: cust } = await supabase
      .from('customers')
      .select('glp_points, liquid_points, full_name')
      .eq('id', data.customer_id)
      .single() as { data: { glp_points: number; liquid_points: number; full_name: string } | null }

    if (!cust) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    const isGlp = (GLP_FUELS as readonly string[]).includes(data.fuel_type)
    const availablePool = isGlp ? cust.glp_points : cust.liquid_points

    if (availablePool < data.points_to_remove) {
      return NextResponse.json(
        { error: `Puntos insuficientes en ese pool. Disponible: ${availablePool}` },
        { status: 422 }
      )
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        customer_id: data.customer_id,
        vehicle_id: null,
        amount_soles: 0,
        points_earned: -data.points_to_remove,
        type: 'annulment',
        fuel_type: data.fuel_type,
        notes: data.notes,
        worker_id: null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Error al anular puntos' }, { status: 500 })

    const { data: updated } = await supabase
      .from('customers')
      .select('total_points, glp_points, liquid_points')
      .eq('id', data.customer_id)
      .single()

    return NextResponse.json({ transaction, points_removed: data.points_to_remove, customer: updated }, { status: 201 })
  }

  // ─── PURCHASE ─────────────────────────────────────────────────────────────
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
        notes: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error al registrar transacción', detail: error.message, code: error.code }, { status: 500 })
    }

    // Fetch updated customer points
    const { data: customer } = await supabase
      .from('customers')
      .select('total_points, glp_points, liquid_points')
      .eq('id', data.customer_id)
      .single()

    // Check for suspicious duplicate vehicle transaction within 2 hours
    if (data.vehicle_id) {
      try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        const { data: prevTx } = await supabase
          .from('transactions')
          .select('id')
          .eq('vehicle_id', data.vehicle_id)
          .eq('type', 'purchase')
          .gt('created_at', twoHoursAgo)
          .neq('id', transaction.id)
          .limit(1)
          .maybeSingle()

        if (prevTx) {
          const [vehicleRes, customerRes, workerRes] = await Promise.all([
            supabase.from('vehicles').select('plate').eq('id', data.vehicle_id).single(),
            supabase.from('customers').select('full_name').eq('id', data.customer_id).single(),
            data.worker_id
              ? supabase.from('workers').select('name').eq('id', data.worker_id).single()
              : Promise.resolve({ data: null }),
          ])
          await supabase.from('transaction_alerts').insert({
            vehicle_plate: vehicleRes.data?.plate ?? 'desconocida',
            customer_id: data.customer_id,
            customer_name: customerRes.data?.full_name ?? 'desconocido',
            worker_id: data.worker_id ?? null,
            worker_name: (workerRes as { data: { name: string } | null }).data?.name ?? null,
            amount_soles: data.amount_soles,
            alert_type: 'duplicate_vehicle',
          })
        }
      } catch { /* don't fail transaction if alert fails */ }
    }

    // Check for suspiciously high amount
    try {
      const { data: thresholdSetting } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'suspicious_amount_threshold')
        .maybeSingle()
      const threshold = parseInt(thresholdSetting?.value ?? '500', 10)

      if (data.amount_soles >= threshold) {
        const [customerRes, workerRes] = await Promise.all([
          supabase.from('customers').select('full_name').eq('id', data.customer_id).single(),
          data.worker_id
            ? supabase.from('workers').select('name').eq('id', data.worker_id).single()
            : Promise.resolve({ data: null }),
        ])
        await supabase.from('transaction_alerts').insert({
          customer_id: data.customer_id,
          customer_name: customerRes.data?.full_name ?? 'desconocido',
          worker_id: data.worker_id ?? null,
          worker_name: (workerRes as { data: { name: string } | null }).data?.name ?? null,
          amount_soles: data.amount_soles,
          alert_type: 'high_amount',
        })
      }
    } catch { /* don't fail transaction if alert fails */ }

    return NextResponse.json({
      transaction,
      points_earned: pointsEarned,
      new_total_points: (customer as { total_points: number } | null)?.total_points ?? null,
      new_glp_points: (customer as { glp_points: number } | null)?.glp_points ?? null,
      new_liquid_points: (customer as { liquid_points: number } | null)?.liquid_points ?? null,
    }, { status: 201 })
  }

  // ─── REDEMPTION ───────────────────────────────────────────────────────────
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
    .select('total_points, glp_points, liquid_points, pin')
    .eq('id', data.customer_id)
    .single() as { data: { total_points: number; glp_points: number; liquid_points: number; pin: string | null } | null; error: unknown }

  // PIN verification
  if (!fetchError && customer && customer.pin !== null) {
    const customerPin = customer.pin
    if (!data.pin) {
      return NextResponse.json({ error: 'PIN requerido', pin_required: true }, { status: 403 })
    }
    const rateCheck = await checkRateLimit(data.customer_id, supabase)
    if (rateCheck.blocked) {
      return NextResponse.json(
        { error: `Demasiados intentos. Espera ${rateCheck.secondsLeft} segundos.` },
        { status: 429 }
      )
    }
    if (data.pin !== customerPin) {
      await recordFailure(data.customer_id, supabase)
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
    }
    await resetAttempts(data.customer_id, supabase)
  }

  if (fetchError || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // Use the correct point pool for this fuel type
  const isGlpRedemption = (GLP_FUELS as readonly string[]).includes(data.fuel_type)
  const availablePoints = isGlpRedemption ? customer.glp_points : customer.liquid_points

  if (availablePoints < pointsRequired) {
    const poolName = isGlpRedemption ? 'GLP' : 'líquidos'
    return NextResponse.json(
      { error: `Puntos ${poolName} insuficientes. Necesitas ${pointsRequired}, tienes ${availablePoints}` },
      { status: 422 }
    )
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id ?? null,
      amount_soles: 0,
      points_earned: -pointsRequired,
      type: 'redemption',
      fuel_type: data.fuel_type,
      worker_id: data.worker_id ?? null,
      notes: null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al registrar canje' }, { status: 500 })
  }

  const { data: updatedCustomer } = await supabase
    .from('customers')
    .select('total_points, glp_points, liquid_points')
    .eq('id', data.customer_id)
    .single()

  return NextResponse.json({
    transaction,
    points_redeemed: pointsRequired,
    new_total_points: (updatedCustomer as { total_points: number } | null)?.total_points ?? null,
    new_glp_points: (updatedCustomer as { glp_points: number } | null)?.glp_points ?? null,
    new_liquid_points: (updatedCustomer as { liquid_points: number } | null)?.liquid_points ?? null,
  }, { status: 201 })
}
