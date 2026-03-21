'use client'

import { motion } from 'framer-motion'
import { CustomerWithVehicles } from '@/lib/supabase'
import { REDEMPTION_GOALS } from '@/lib/constants'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type ModalType = 'transaction' | 'vehicle' | 'redemption'

interface CustomerCardProps {
  customer: CustomerWithVehicles
  onAction: (modal: ModalType) => void
}

export default function CustomerCard({ customer, onAction }: CustomerCardProps) {
  const nextGoal = REDEMPTION_GOALS.find((g) => g.pointsRequired > customer.total_points)
  const canRedeem = REDEMPTION_GOALS.some((g) => g.pointsRequired <= customer.total_points)

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
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-400">
              {customer.total_points.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">puntos acumulados</div>
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
        </div>
      </Card>
    </motion.div>
  )
}
