import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('worker_session')
  return session?.value === 'authenticated'
}

// GET /api/backup — list saved backups (id + created_at, no data)
export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('backups')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) return NextResponse.json({ error: 'Error al obtener backups' }, { status: 500 })
  return NextResponse.json({ backups: data ?? [] })
}

// POST /api/backup
export async function POST(request: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const supabase = await createServiceClient()

  // ── SAVE backup to DB ─────────────────────────────────────────────────────
  if (body.action === 'save') {
    if (body.password !== 'angelccasa284') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 })
    }

    const [customers, vehicles, transactions, workers, alerts, settings] = await Promise.all([
      supabase.from('customers').select('*').order('created_at'),
      supabase.from('vehicles').select('*').order('created_at'),
      supabase.from('transactions').select('*').order('created_at'),
      supabase.from('workers').select('*').order('created_at'),
      supabase.from('transaction_alerts').select('*').order('created_at'),
      supabase.from('app_settings').select('*'),
    ])

    const snapshot = {
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

    const { data: saved, error: insertError } = await supabase
      .from('backups')
      .insert({ data: snapshot })
      .select('id, created_at')
      .single()

    if (insertError) return NextResponse.json({ error: 'Error al guardar backup' }, { status: 500 })

    // Keep only last 3 — delete older ones
    const { data: all } = await supabase
      .from('backups')
      .select('id')
      .order('created_at', { ascending: false })

    if (all && all.length > 3) {
      const toDelete = all.slice(3).map(b => b.id)
      await supabase.from('backups').delete().in('id', toDelete)
    }

    return NextResponse.json({ success: true, backup: saved })
  }

  // ── RESTORE from saved backup ID ──────────────────────────────────────────
  if (body.action === 'restore') {
    if (body.password !== 'angelccasa284') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 })
    }

    if (!body.backup_id) return NextResponse.json({ error: 'backup_id requerido' }, { status: 400 })

    const { data: row } = await supabase
      .from('backups')
      .select('data')
      .eq('id', body.backup_id)
      .single()

    if (!row?.data?.data) return NextResponse.json({ error: 'Backup no encontrado' }, { status: 404 })

    const d = row.data.data

    // Clear existing data (keep workers + app_settings)
    const tables = ['pin_attempts', 'transaction_alerts', 'transactions', 'vehicles', 'customers', 'corporate_contacts']
    for (const table of tables) {
      await supabase.from(table as 'customers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // Restore in FK-safe order
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

  // ── RESET (keep workers) ──────────────────────────────────────────────────
  if (body.action === 'reset') {
    if (body.password !== 'angelccasa284') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 })
    }

    const tables = ['pin_attempts', 'transaction_alerts', 'transactions', 'vehicles', 'customers', 'corporate_contacts']
    for (const table of tables) {
      await supabase.from(table as 'customers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
