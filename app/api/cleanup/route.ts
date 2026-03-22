import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = await createServiceClient()

    // Delete DNI photos older than 2 days from Storage
    const { data: files } = await supabase.storage
      .from('dni-photos')
      .list('', { limit: 200, sortBy: { column: 'created_at', order: 'asc' } })

    if (files && files.length > 0) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      const oldFiles = files.filter(f => {
        const created = new Date(f.created_at ?? f.updated_at ?? 0)
        return created < twoDaysAgo
      })
      if (oldFiles.length > 0) {
        await supabase.storage.from('dni-photos').remove(oldFiles.map(f => f.name))
      }
    }

    // Delete transaction_alerts older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('transaction_alerts')
      .delete()
      .lt('created_at', ninetyDaysAgo)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
