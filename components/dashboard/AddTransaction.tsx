'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Vehicle } from '@/lib/supabase'
import { FUEL_TYPES, POINTS_PER_SOL } from '@/lib/constants'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface AddTransactionProps {
  customerId: string
  vehicles: Vehicle[]
  onSuccess: (pointsEarned: number) => void
}

export default function AddTransaction({ customerId, vehicles, onSuccess }: AddTransactionProps) {
  const [amount, setAmount] = useState('')
  const [fuelType, setFuelType] = useState<string>('Regular')
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pointsPreview = Math.floor(parseFloat(amount || '0') * POINTS_PER_SOL)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Ingresa un monto válido')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'purchase',
          customer_id: customerId,
          vehicle_id: vehicleId || null,
          amount_soles: amountNum,
          fuel_type: fuelType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      onSuccess(data.points_earned)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount */}
      <Input
        label="Monto de la compra (S/)"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        icon={<span className="text-slate-400 text-sm font-bold">S/</span>}
      />

      {/* Points preview */}
      <AnimatePresence>
        {pointsPreview > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-yellow-400/8 border border-yellow-400/20"
          >
            <span className="text-sm text-slate-300">Puntos a sumar:</span>
            <span className="text-xl font-bold text-yellow-400">+{pointsPreview.toLocaleString()} pts</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fuel type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Tipo de combustible</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FUEL_TYPES.map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setFuelType(ft)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                fuelType === ft
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/4 border-white/10 text-slate-400 hover:bg-white/8 hover:text-slate-300'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle selector */}
      {vehicles.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Vehículo (opcional)</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
          >
            <option value="">Sin vehículo específico</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
        </div>
      )}

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
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full"
      >
        Registrar Compra y Sumar Puntos
      </Button>
    </form>
  )
}
