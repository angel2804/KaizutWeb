'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { REDEMPTION_GOALS } from '@/lib/constants'
import { FuelType } from '@/lib/constants'
import Button from '@/components/ui/Button'

interface RedemptionPanelProps {
  customerId: string
  currentPoints: number
  has_pin: boolean
  onSuccess: (fuelType: FuelType, pointsRedeemed: number) => void
}

type Step = 'select' | 'pin' | 'confirm'

export default function RedemptionPanel({ customerId, currentPoints, has_pin, onSuccess }: RedemptionPanelProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSelectFuel = (fuelType: FuelType) => {
    setSelectedFuel(fuelType)
    setPinError('')
    setPin('')
    setError('')
    setStep('pin')
  }

  const handlePinContinue = () => {
    setPinError('')
    setStep('confirm')
  }

  const handleSkipPin = () => {
    setPin('')
    setStep('confirm')
  }

  const handleRedeem = async () => {
    if (!selectedFuel) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'redemption',
          customer_id: customerId,
          fuel_type: selectedFuel,
          ...(pin ? { pin } : {}),
        }),
      })
      const data = await res.json()
      if (res.status === 401) {
        setPinError(data.error || 'PIN incorrecto')
        setStep('pin')
        return
      }
      if (res.status === 403) {
        setPinError('PIN requerido')
        setStep('pin')
        return
      }
      if (res.status === 429) {
        setError(data.error || 'Demasiados intentos')
        setStep('select')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Error')
      setStep('select')
      setSelectedFuel(null)
      setPin('')
      onSuccess(selectedFuel, data.points_redeemed)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al canjear')
    } finally {
      setLoading(false)
    }
  }

  const selectedGoal = REDEMPTION_GOALS.find(g => g.fuelType === selectedFuel)

  return (
    <div className="space-y-4">
      {/* Step: select fuel */}
      {step === 'select' && (
        <>
          <p className="text-sm text-slate-400 mb-4">
            Tienes <span className="text-yellow-400 font-bold text-base">{currentPoints.toLocaleString()} puntos</span>.
            Selecciona el combustible para canjear 1 galón gratis.
          </p>

          {REDEMPTION_GOALS.map((goal, i) => {
            const canRedeem = currentPoints >= goal.pointsRequired
            const pct = Math.min(100, (currentPoints / goal.pointsRequired) * 100)

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

                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: goal.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + i * 0.08 }}
                  />
                </div>

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
                    onClick={() => handleSelectFuel(goal.fuelType)}
                  >
                    {canRedeem ? '🎁 Canjear' : 'Bloqueado'}
                  </Button>
                </div>
              </motion.div>
            )
          })}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </>
      )}

      {/* Step: PIN entry */}
      {step === 'pin' && selectedGoal && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <button
            onClick={() => setStep('select')}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>

          <div className="p-4 rounded-xl border border-white/8 bg-white/3 flex items-center gap-3">
            <span className="text-2xl">{selectedGoal.icon}</span>
            <div>
              <p className="font-semibold text-white text-sm">{selectedGoal.label}</p>
              <p className="text-xs text-slate-400">{selectedGoal.pointsRequired.toLocaleString()} pts → 1 galón</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                PIN del cliente
              </label>
              <p className="text-xs text-slate-500 mb-2">El cliente debe ingresar su PIN personal.</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError('') }}
                placeholder="••••"
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-600 tracking-widest transition-colors"
              />
              {pinError && (
                <p className="mt-1.5 text-xs text-red-400">{pinError}</p>
              )}
            </div>

            <Button
              variant="accent"
              size="lg"
              className="w-full"
              disabled={pin.length < 4}
              onClick={handlePinContinue}
            >
              Continuar
            </Button>

            {!has_pin && (
              <button
                onClick={handleSkipPin}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
              >
                ¿Sin PIN? Continuar sin verificar →
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Step: confirm */}
      {step === 'confirm' && selectedGoal && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <button
            onClick={() => setStep('pin')}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>

          <div className="p-5 rounded-xl border border-white/10 bg-white/3 text-center space-y-2">
            <span className="text-3xl">{selectedGoal.icon}</span>
            <p className="text-white font-semibold">
              ¿Confirmar canje de {selectedGoal.pointsRequired.toLocaleString()} puntos?
            </p>
            <p className="text-sm text-slate-400">
              1 galón de <span className="text-white">{selectedGoal.label}</span> gratis
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="danger" size="lg" className="flex-1" onClick={() => setStep('select')}>
              Cancelar
            </Button>
            <Button variant="accent" size="lg" className="flex-1" loading={loading} onClick={handleRedeem}>
              Confirmar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
