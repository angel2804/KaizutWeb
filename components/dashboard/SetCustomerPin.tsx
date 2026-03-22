'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'

interface SetCustomerPinProps {
  customerId: string
  customerName: string
  hasPin: boolean
  onSuccess: () => void
}

export default function SetCustomerPin({ customerId, customerName, hasPin, onSuccess }: SetCustomerPinProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const pinMismatch = confirmPin.length >= pin.length && pin !== confirmPin
  const canSubmit = pin.length >= 4 && pin === confirmPin

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/customers/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', customer_id: customerId, pin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar PIN')
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    setError('')
    try {
      const res = await fetch('/api/customers/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', customer_id: customerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al resetear PIN')
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setResetting(false)
      setShowConfirmReset(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        {hasPin
          ? `Configura un nuevo PIN para ${customerName}.`
          : `Establece un PIN de seguridad para ${customerName}. Se solicitará al momento de canjear puntos.`}
      </p>

      <form onSubmit={handleSetPin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Nuevo PIN (4-6 dígitos)</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
            placeholder="••••"
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-600 tracking-widest transition-colors"
          />
          <p className="text-xs text-slate-600 mt-0.5">{pin.length}/6 dígitos</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirmar PIN</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••"
            className={`w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-600 tracking-widest transition-colors ${
              pinMismatch ? 'border-red-500/50' : 'border-white/10 focus:border-red-500/50'
            }`}
          />
          {pinMismatch && (
            <p className="text-xs text-red-400 mt-0.5">Los PINs no coinciden</p>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!canSubmit}>
          {hasPin ? 'Cambiar PIN' : 'Guardar PIN'}
        </Button>
      </form>

      {/* Reset section — only when customer already has a PIN */}
      {hasPin && (
        <div className="pt-4 border-t border-white/8">
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-sm text-slate-500 hover:text-red-400 transition-colors"
            >
              Olvidó su PIN — Resetear y quitar PIN
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-amber-300">
                ¿Confirmar reseteo? El cliente podrá canjear sin PIN hasta que configure uno nuevo.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowConfirmReset(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" size="sm" loading={resetting} onClick={handleReset}>
                  Resetear PIN
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
