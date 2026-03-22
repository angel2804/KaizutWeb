import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

const SetPinSchema = z.object({
  action: z.literal('set'),
  customer_id: z.string().uuid(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN debe ser 4-6 dígitos numéricos'),
  worker_id: z.string().uuid().optional(),
})

const ResetPinSchema = z.object({
  action: z.literal('reset'),
  customer_id: z.string().uuid(),
  reason: z.string().min(1, 'El motivo es obligatorio'),
  worker_name: z.string().optional(),
  worker_id: z.string().uuid().optional(),
})

const SelfResetSchema = z.object({
  action: z.literal('self-reset'),
  customer_id: z.string().uuid(),
  new_pin: z.string().regex(/^\d{4,6}$/, 'PIN debe ser 4-6 dígitos numéricos'),
  dni_photo_base64: z.string().min(1),
})

const PinSchema = z.discriminatedUnion('action', [SetPinSchema, ResetPinSchema, SelfResetSchema])

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = PinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const data = parsed.data

  // ─── SELF-RESET (no auth required — customer uploads DNI photo) ───────────
  if (data.action === 'self-reset') {
    // Fetch customer name for the alert
    const { data: cust } = await supabase
      .from('customers')
      .select('full_name')
      .eq('id', data.customer_id)
      .single()

    if (!cust) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    // Upload DNI photo to Supabase Storage
    let photoUrl: string | null = null
    try {
      const base64Data = data.dni_photo_base64.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `dni-${data.customer_id}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('dni-photos')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: false })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('dni-photos').getPublicUrl(fileName)
        photoUrl = urlData?.publicUrl ?? null
      }
    } catch { /* photo upload failure is non-fatal */ }

    // Set the new PIN
    const { error: pinError } = await supabase
      .from('customers')
      .update({ pin: data.new_pin })
      .eq('id', data.customer_id)

    if (pinError) return NextResponse.json({ error: 'Error al actualizar PIN' }, { status: 500 })

    // Insert admin alert with photo URL
    await supabase.from('transaction_alerts').insert({
      vehicle_id: null,
      vehicle_plate: null,
      customer_id: data.customer_id,
      customer_name: cust.full_name,
      worker_id: null,
      worker_name: null,
      transaction_id: null,
      prev_transaction_id: null,
      amount_soles: 0,
      alert_type: 'pin_self_reset',
      reason: photoUrl ? `Foto DNI: ${photoUrl}` : 'PIN restablecido por el cliente (sin foto)',
    })

    return NextResponse.json({ success: true })
  }

  // Worker-authenticated actions (set / reset)
  // Accept either admin cookie OR a valid worker_id from the workers table
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  const hasAdminSession = session?.value === 'authenticated'

  if (!hasAdminSession) {
    const wid = (data as { worker_id?: string }).worker_id
    if (!wid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { data: workerRow } = await supabase
      .from('workers')
      .select('id')
      .eq('id', wid)
      .eq('is_active', true)
      .maybeSingle()
    if (!workerRow) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (data.action === 'set') {
    const { error } = await supabase
      .from('customers')
      .update({ pin: data.pin })
      .eq('id', data.customer_id)

    if (error) return NextResponse.json({ error: 'Error al guardar PIN' }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // reset — requires reason, creates admin alert
  const { data: cust } = await supabase
    .from('customers')
    .select('full_name')
    .eq('id', data.customer_id)
    .single()

  const { error } = await supabase
    .from('customers')
    .update({ pin: null })
    .eq('id', data.customer_id)

  if (error) return NextResponse.json({ error: 'Error al resetear PIN' }, { status: 500 })

  // Insert admin alert
  await supabase.from('transaction_alerts').insert({
    vehicle_id: null,
    vehicle_plate: null,
    customer_id: data.customer_id,
    customer_name: cust?.full_name ?? 'desconocido',
    worker_id: null,
    worker_name: data.worker_name ?? null,
    transaction_id: null,
    prev_transaction_id: null,
    amount_soles: 0,
    alert_type: 'pin_reset',
    reason: data.reason,
  })

  return NextResponse.json({ success: true })
}
