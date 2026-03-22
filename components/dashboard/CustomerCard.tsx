'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CustomerWithVehicles } from '@/lib/supabase'
import { REDEMPTION_GOALS } from '@/lib/constants'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type ModalType = 'transaction' | 'vehicle' | 'redemption' | 'set-pin' | 'annul-points'

interface CustomerCardProps {
  customer: CustomerWithVehicles
  onAction: (modal: ModalType) => void
}

export default function CustomerCard({ customer, onAction }: CustomerCardProps) {
  const [showPin, setShowPin] = useState(false)
  // glp_points / liquid_points may be present from the API
  const glpPoints = (customer as typeof customer & { glp_points?: number }).glp_points ?? 0
  const liquidPoints = (customer as typeof customer & { liquid_points?: number }).liquid_points ?? 0
  const nextGoal = REDEMPTION_GOALS.find((g) => g.pointsRequired > customer.total_points)
  const canRedeem = REDEMPTION_GOALS.some((g) => {
    const pts = g.fuelType === 'GLP' ? glpPoints : liquidPoints
    return pts >= g.pointsRequired
  })

  // pin is only present for admin sessions
  const plainPin = (customer as typeof customer & { pin?: string }).pin

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card padding="lg" className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{customer.full_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge color="gray">DNI: {customer.dni}</Badge>
                {customer.email && (
                  <span className="text-xs text-slate-500">{customer.email}</span>
                )}
              </div>
            </div>
          </div>

          {/* Points */}
          <div className="text-right space-y-1">
            <div>
              <span className="text-xl font-bold text-blue-300">{glpPoints.toLocaleString()}</span>
              <span className="text-xs text-slate-500 ml-1">GLP</span>
            </div>
            <div>
              <span className="text-xl font-bold text-yellow-400">{liquidPoints.toLocaleString()}</span>
              <span className="text-xs text-slate-500 ml-1">líq.</span>
            </div>
          </div>
        </div>

        {/* Progress to next goal */}
        {nextGoal && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Próxima meta: {nextGoal.label}</span>
              <span>{customer.total_points} / {nextGoal.pointsRequired} pts</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: nextGoal.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (customer.total_points / nextGoal.pointsRequired) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Faltan {Math.max(0, nextGoal.pointsRequired - customer.total_points).toLocaleString()} puntos
            </p>
          </div>
        )}

        {canRedeem && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <span className="text-green-400">🎉</span>
            <span className="text-sm text-green-400 font-medium">
              ¡Este cliente puede canjear puntos por galones gratis!
            </span>
          </div>
        )}

        {/* PIN status */}
        {!customer.has_pin ? (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-base">⚠️</span>
              <span className="text-sm text-amber-300">Cliente sin PIN — canjes sin verificación</span>
            </div>
            <button
              onClick={() => onAction('set-pin')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors underline"
            >
              Configurar PIN
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-500/8 border border-green-500/15">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-base">🔒</span>
              <span className="text-sm text-green-300">PIN configurado</span>
              {plainPin && (
                <span className="text-sm font-mono text-white ml-1">
                  {showPin ? plainPin : '●'.repeat(plainPin.length)}
                </span>
              )}
              {plainPin && (
                <button
                  onClick={() => setShowPin(s => !s)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-1"
                >
                  {showPin ? 'Ocultar' : 'Ver'}
                </button>
              )}
            </div>
            <button
              onClick={() => onAction('set-pin')}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cambiar / Resetear
            </button>
          </div>
        )}

        {/* Vehicles */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Vehículos registrados</h4>
          {customer.vehicles.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Sin vehículos registrados</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customer.vehicles.map((v) => (
                <Badge key={v.id} color="blue">
                  🚗 {v.plate}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
          <Button variant="primary" size="sm" onClick={() => onAction('transaction')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Compra
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onAction('vehicle')}>
            🚗 Agregar Vehículo
          </Button>
          <Button
            variant={canRedeem ? 'accent' : 'ghost'}
            size="sm"
            onClick={() => onAction('redemption')}
          >
            🎁 Canjear Puntos
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAction('annul-points')}>
            ✂️ Anular Puntos
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
