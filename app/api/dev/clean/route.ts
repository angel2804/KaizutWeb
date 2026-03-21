import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  // Delete in FK-safe order: transactions → vehicles → customers → corporate_contacts
  const steps = [
    supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('corporate_contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]

  for (const step of steps) {
    const { error } = await step
    if (error) {
      return NextResponse.json({ error: 'Error al limpiar: ' + error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
