import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type') // 'name' | 'plate'

  if (!q) return NextResponse.json({ error: 'Query requerida' }, { status: 400 })

  const supabase = await createServiceClient()

  if (type === 'name') {
    const { data, error } = await supabase
      .from('customers')
      .select('id, dni, full_name, total_points')
      .ilike('full_name', `%${q}%`)
      .limit(10)

    if (error) return NextResponse.json({ error: 'Error al buscar' }, { status: 500 })
    return NextResponse.json({ customers: data })
  }

  if (type === 'plate') {
    const { data, error } = await supabase
      .from('vehicles')
      .select('plate, customer:customers(id, dni, full_name, total_points)')
      .ilike('plate', `${q}%`)
      .limit(5)

    if (error) return NextResponse.json({ error: 'Error al buscar' }, { status: 500 })
    const customers = data.map((v) => v.customer).filter(Boolean)
    return NextResponse.json({ customers })
  }

  return NextResponse.json({ error: 'Tipo de búsqueda inválido' }, { status: 400 })
}
