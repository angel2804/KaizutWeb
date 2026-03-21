import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  company: z.string().min(2, 'Empresa muy corta'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = ContactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('corporate_contacts')
    .insert({
      name: parsed.data.name,
      company: parsed.data.company,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
    })

  if (error) {
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
