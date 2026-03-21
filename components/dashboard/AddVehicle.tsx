'use client'

import { useState } from 'react'
import { Vehicle } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface AddVehicleProps {
  customerId: string
  onSuccess: (vehicle: Vehicle) => void
}

export default function AddVehicle({ customerId, onSuccess }: AddVehicleProps) {
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plate.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, plate: plate.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      onSuccess(data.vehicle)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Número de placa"
        placeholder="ABC-123"
        value={plate}
        onChange={(e) => {
          setPlate(e.target.value.toUpperCase())
          if (error) setError('')
        }}
        maxLength={10}
        hint='Ej: ABC-123 · XYZ789 (máx. 10 caracteres)'
        error={error}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2z" />
          </svg>
        }
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={!plate.trim()}
        className="w-full"
      >
        Registrar Vehículo
      </Button>
    </form>
  )
}
