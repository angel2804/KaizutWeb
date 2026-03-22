import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  return session?.value === 'authenticated'
}

// GET /api/backup — download full DB as JSON
export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = await createServiceClient()

  const [customers, vehicles, transactions, workers, alerts, settings] = await Promise.all([
    supabase.from('customers').select('*').order('created_at'),
    supabase.from('vehicles').select('*').order('created_at'),
    supabase.from('transactions').select('*').order('created_at'),
    supabase.from('workers').select('*').order('created_at'),
    supabase.from('transaction_alerts').select('*').order('created_at'),
    supabase.from('app_settings').select('*'),
  ])

  const backup = {
    version: 1,
    created_at: new Date().toISOString(),
    data: {
      customers: customers.data ?? [],
      vehicles: vehicles.data ?? [],
      transactions: transactions.data ?? [],
      workers: workers.data ?? [],
      transaction_alerts: alerts.data ?? [],
      app_settings: settings.data ?? [],
    },
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-kaizut-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}

// POST /api/backup — restore from JSON or reset DB
export async function POST(request: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  // ── RESET (password protected) ────────────────────────────────────────────
  if (body.action === 'reset') {
    if (body.password !== 'angelccasa284') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 })
    }

    const supabase = await createServiceClient()

    // Delete in FK-safe order, keep workers and app_settings
    const tables = ['pin_attempts', 'transaction_alerts', 'transactions', 'vehicles', 'customers', 'corporate_contacts']
    for (const table of tables) {
      await supabase.from(table as 'customers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    return NextResponse.json({ success: true })
  }

  // ── RESTORE from backup JSON ───────────────────────────────────────────────
  if (body.action === 'restore') {
    const backup = body.backup
    if (!backup?.data) return NextResponse.json({ error: 'Archivo de backup inválido' }, { status: 400 })

    const supabase = await createServiceClient()
    const d = backup.data

    // Clear existing data first (keep workers)
    const tables = ['pin_attempts', 'transaction_alerts', 'transactions', 'vehicles', 'customers', 'corporate_contacts']
    for (const table of tables) {
      await supabase.from(table as 'customers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // Restore in order (respect FK constraints)
    if (d.customers?.length) await supabase.from('customers').insert(d.customers)
    if (d.vehicles?.length) await supabase.from('vehicles').insert(d.vehicles)
    if (d.transactions?.length) await supabase.from('transactions').insert(d.transactions)
    if (d.transaction_alerts?.length) await supabase.from('transaction_alerts').insert(d.transaction_alerts)
    if (d.app_settings?.length) {
      for (const s of d.app_settings) {
        await supabase.from('app_settings').upsert(s)
      }
    }

    return NextResponse.json({ success: true, restored: {
      customers: d.customers?.length ?? 0,
      transactions: d.transactions?.length ?? 0,
    }})
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
