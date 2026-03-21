'use client'

import { useState } from 'react'
import { CustomerWithVehicles } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface CreateCustomerProps {
  initialDni: string
  onSuccess: (customer: CustomerWithVehicles) => void
}

export default function CreateCustomer({ initialDni, onSuccess }: CreateCustomerProps) {
  const [form, setForm] = useState({
    dni: initialDni,
    full_name: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      onSuccess(data.customer)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="DNI *"
        value={form.dni}
        readOnly
        className="opacity-60 cursor-not-allowed"
        hint="DNI ingresado en la búsqueda"
      />
      <Input
        label="Nombre completo *"
        placeholder="Juan Pérez García"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        autoFocus
      />
      <Input
        label="Correo electrónico"
        type="email"
        placeholder="juan@email.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Teléfono"
        type="tel"
        placeholder="+51 999 000 000"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={!form.full_name.trim()}
        className="w-full"
      >
        Registrar Cliente
      </Button>
    </form>
  )
}
