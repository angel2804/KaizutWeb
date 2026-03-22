import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { checkRateLimit, recordFailure, resetAttempts } from '@/lib/pin-rate-limit'
import { z } from 'zod'

const VerifySchema = z.object({
  customer_id: z.string().uuid(),
  pin: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = VerifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { customer_id, pin } = parsed.data
  const supabase = await createServiceClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('pin')
    .eq('id', customer_id)
    .single() as { data: { pin: string | null } | null }

  if (!customer) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  if (customer.pin === null) return NextResponse.json({ success: true })

  const rateCheck = await checkRateLimit(customer_id, supabase)
  if (rateCheck.blocked) {
    return NextResponse.json(
      { error: `Demasiados intentos. Espera ${rateCheck.secondsLeft} segundos.` },
      { status: 429 }
    )
  }

  if (pin !== customer.pin) {
    await recordFailure(customer_id, supabase)
    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  }

  await resetAttempts(customer_id, supabase)
  return NextResponse.json({ success: true })
}
