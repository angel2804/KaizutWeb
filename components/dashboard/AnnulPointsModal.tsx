'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomerWithVehicles } from '@/lib/supabase'
import Button from '@/components/ui/Button'

interface AnnulPointsModalProps {
  customer: CustomerWithVehicles
  onSuccess: () => void
}

type Pool = 'GLP' | 'liquid'

export default function AnnulPointsModal({ customer, onSuccess }: AnnulPointsModalProps) {
  const glpPoints = (customer as typeof customer & { glp_points?: number }).glp_points ?? 0
  const liquidPoints = (customer as typeof customer & { liquid_points?: number }).liquid_points ?? 0

  const [pool, setPool] = useState<Pool>('GLP')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [removed, setRemoved] = useState(0)

  const available = pool === 'GLP' ? glpPoints : liquidPoints
  const fuelType = pool === 'GLP' ? 'GLP' : 'Premium'  // Premium represents the liquid pool
  const pointsNum = parseInt(points, 10) || 0
  const canSubmit = pointsNum > 0 && pointsNum <= available && reason.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'annulment',
        customer_id: customer.id,
        fuel_type: fuelType,
        points_to_remove: pointsNum,
        notes: reason.trim(),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al anular puntos')
      setSubmitting(false)
      return
    }

    setRemoved(pointsNum)
    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center py-4">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-3xl mx-auto">✅</div>
        <div>
          <p className="font-bold text-white text-base">Puntos anulados</p>
          <p className="text-sm text-slate-400 mt-1">
            Se removieron <span className="text-red-400 font-bold">{removed.toLocaleString()} pts {pool === 'GLP' ? 'GLP' : 'líquidos'}</span> de {customer.full_name}.
          </p>
          <p className="text-xs text-slate-500 mt-1">El cliente podrá ver el motivo en su perfil de "Ver QR".</p>
        </div>
        <Button variant="secondary" size="md" className="w-full" onClick={onSuccess}>
          Listo
        </Button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-sm font-semibold text-white">{customer.full_name}</p>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-blue-300 font-bold">{glpPoints.toLocaleString()} pts GLP</span>
          <span className="text-yellow-400 font-bold">{liquidPoints.toLocaleString()} pts líquidos</span>
        </div>
      </div>

      {/* Pool selector */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Pool de puntos a afectar</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPool('GLP')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${pool === 'GLP' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-white/4 border-white/10 text-slate-400 hover:bg-white/8'}`}>
            GLP · {glpPoints.toLocaleString()} pts
          </button>
          <button type="button" onClick={() => setPool('liquid')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${pool === 'liquid' ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300' : 'bg-white/4 border-white/10 text-slate-400 hover:bg-white/8'}`}>
            Líquidos · {liquidPoints.toLocaleString()} pts
          </button>
        </div>
      </div>

      {/* Points amount */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Puntos a remover *</label>
        <input
          type="number"
          min="1"
          max={available}
          value={points}
          onChange={e => { setPoints(e.target.value); setError('') }}
          placeholder={`Máx. ${available.toLocaleString()}`}
          className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-500 transition-colors"
        />
        {pointsNum > 0 && pointsNum <= available && (
          <p className="text-xs text-slate-500 mt-1">
            Saldo después: {(available - pointsNum).toLocaleString()} pts {pool === 'GLP' ? 'GLP' : 'líquidos'}
          </p>
        )}
        {pointsNum > available && available > 0 && (
          <p className="text-xs text-red-400 mt-1">Excede los puntos disponibles ({available.toLocaleString()})</p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Motivo (visible para el cliente) *</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ej: Ajuste por error de registro el 15/03"
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-500 resize-none transition-colors"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {canSubmit && (
        <div className="px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-300">
          Se removerán <strong>{pointsNum.toLocaleString()} pts {pool === 'GLP' ? 'GLP' : 'líquidos'}</strong> de {customer.full_name}. Esta acción es visible para el cliente.
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full"
        disabled={!canSubmit} loading={submitting}>
        Confirmar anulación
      </Button>
    </form>
  )
}
