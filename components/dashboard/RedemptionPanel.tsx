'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { REDEMPTION_GOALS } from '@/lib/constants'
import { FuelType } from '@/lib/constants'
import Button from '@/components/ui/Button'

interface RedemptionPanelProps {
  customerId: string
  currentPoints: number
  onSuccess: (fuelType: FuelType, pointsRedeemed: number) => void
}

export default function RedemptionPanel({ customerId, currentPoints, onSuccess }: RedemptionPanelProps) {
  const [loadingFuel, setLoadingFuel] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirmFuel, setConfirmFuel] = useState<FuelType | null>(null)

  const handleRedeem = async (fuelType: FuelType) => {
    setError('')
    setLoadingFuel(fuelType)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'redemption',
          customer_id: customerId,
          fuel_type: fuelType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setConfirmFuel(null)
      onSuccess(fuelType, data.points_redeemed)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al canjear')
    } finally {
      setLoadingFuel(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 mb-4">
        Tienes <span className="text-yellow-400 font-bold text-base">{currentPoints.toLocaleString()} puntos</span>.
        Selecciona el combustible para canjear 1 galón gratis.
      </p>

      {REDEMPTION_GOALS.map((goal, i) => {
        const canRedeem = currentPoints >= goal.pointsRequired
        const pct = Math.min(100, (currentPoints / goal.pointsRequired) * 100)
        const isConfirming = confirmFuel === goal.fuelType

        return (
          <motion.div
            key={goal.fuelType}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="p-4 rounded-xl border transition-colors"
            style={{
              background: canRedeem ? goal.bgColor : 'rgba(255,255,255,0.03)',
              borderColor: canRedeem ? goal.borderColor : 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div>
                  <h4 className="font-semibold text-white text-sm">{goal.label}</h4>
                  <p className="text-xs text-slate-400">{goal.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: goal.color }}>
                  {goal.pointsRequired.toLocaleString()} pts
                </div>
                <div className="text-xs text-slate-500">= 1 galón</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-full"
                style={{ background: goal.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + i * 0.08 }}
              />
            </div>

            {/* Action */}
            {isConfirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 flex-1">
                  ¿Confirmar canje de {goal.pointsRequired.toLocaleString()} puntos por 1 galón de {goal.label}?
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmFuel(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  loading={loadingFuel === goal.fuelType}
                  onClick={() => handleRedeem(goal.fuelType)}
                >
                  Confirmar
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {canRedeem
                    ? `Tienes ${(currentPoints - goal.pointsRequired).toLocaleString()} pts de sobra`
                    : `Faltan ${(goal.pointsRequired - currentPoints).toLocaleString()} puntos`}
                </span>
                <Button
                  variant={canRedeem ? 'accent' : 'ghost'}
                  size="sm"
                  disabled={!canRedeem}
                  onClick={() => setConfirmFuel(goal.fuelType)}
                >
                  {canRedeem ? '🎁 Canjear' : 'Bloqueado'}
                </Button>
              </div>
            )}
          </motion.div>
        )
      })}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
    </div>
  )
}
