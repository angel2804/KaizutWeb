'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useRedemptionGoals } from '@/lib/useRedemptionGoals'

interface CustomerResult {
  id: string
  dni: string
  full_name: string
  total_points: number
  glp_points: number
  liquid_points: number
  has_pin: boolean
}

interface AnnulmentRecord {
  id: string
  points_earned: number
  fuel_type: string
  notes: string | null
  created_at: string
}

type Step = 'search' | 'qr' | 'balance' | 'pin-reset' | 'reset-done'

interface VerPuntosDropdownProps {
  onClose?: () => void
}

const GLP_FUELS = ['GLP']
const LIQUID_FUELS = ['Premium', 'Regular', 'Bio']

export default function VerPuntosDropdown({ onClose }: VerPuntosDropdownProps) {
  const REDEMPTION_GOALS = useRedemptionGoals()
  const glpGoals = REDEMPTION_GOALS.filter(g => GLP_FUELS.includes(g.fuelType))
  const liquidGoals = REDEMPTION_GOALS.filter(g => LIQUID_FUELS.includes(g.fuelType))

  const [step, setStep] = useState<Step>('search')
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customer, setCustomer] = useState<CustomerResult | null>(null)
  const [annulments, setAnnulments] = useState<AnnulmentRecord[]>([])

  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)

  const [resetPhoto, setResetPhoto] = useState<string | null>(null)
  const [resetPin, setResetPin] = useState('')
  const [resetPinConfirm, setResetPinConfirm] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dni.length !== 8) return
    setLoading(true)
    setError('')

    const res = await fetch(`/api/customers?dni=${encodeURIComponent(dni)}`)
    if (res.status === 404) { setError('No encontramos una cuenta con ese DNI.'); setLoading(false); return }
    if (!res.ok) { setError('Error al consultar. Intenta de nuevo.'); setLoading(false); return }

    const data = await res.json()
    setCustomer(data.customer)

    try {
      const txRes = await fetch(`/api/transactions?customer_id=${data.customer.id}`)
      if (txRes.ok) {
        const txData = await txRes.json()
        const recent = (txData.transactions ?? [])
          .filter((t: AnnulmentRecord & { type: string }) => t.type === 'annulment')
          .slice(0, 3)
        setAnnulments(recent)
      }
    } catch { /* non-fatal */ }

    setStep('qr')
    setLoading(false)
  }

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || pinInput.length < 4) return
    setPinLoading(true)
    setPinError('')

    const res = await fetch('/api/customers/pin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customer.id, pin: pinInput }),
    })

    if (!res.ok) {
      const d = await res.json()
      setPinError(d.error || 'PIN incorrecto')
      setPinLoading(false)
      return
    }
    setStep('balance')
    setPinLoading(false)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setResetPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSelfReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !resetPhoto || resetPin.length < 4 || resetPin !== resetPinConfirm) return
    setResetLoading(true)
    setResetError('')

    const res = await fetch('/api/customers/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'self-reset', customer_id: customer.id, new_pin: resetPin, dni_photo_base64: resetPhoto }),
    })

    if (!res.ok) {
      const d = await res.json()
      setResetError(d.error || 'Error al restablecer PIN')
      setResetLoading(false)
      return
    }
    setStep('reset-done')
    setResetLoading(false)
  }

  const handleReset = () => {
    setCustomer(null); setDni(''); setError(''); setPinInput(''); setPinError(''); setAnnulments([])
    setStep('search')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ── RESET DONE ─────────────────────────────────────────────────────────────
  if (step === 'reset-done') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-3xl mx-auto">✅</div>
        <div>
          <p className="font-bold text-white text-base">PIN restablecido</p>
          <p className="text-sm text-slate-400 mt-1">Tu nuevo PIN fue guardado. Un administrador revisará la foto de tu DNI.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setStep('qr'); setResetPhoto(null); setResetPin(''); setResetPinConfirm('') }}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 transition-colors">
            Volver
          </button>
          {onClose && <button onClick={onClose} className="px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-colors">Cerrar</button>}
        </div>
      </motion.div>
    )
  }

  // ── SELF PIN RESET ─────────────────────────────────────────────────────────
  if (step === 'pin-reset') {
    const pinMismatch = resetPinConfirm.length >= resetPin.length && resetPin !== resetPinConfirm
    const canSubmit = !!resetPhoto && resetPin.length >= 4 && resetPin === resetPinConfirm
    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-white">Restablecer PIN</p>
          <p className="text-xs text-slate-400 mt-1">Necesitamos una foto de tu DNI para verificar tu identidad.</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Foto de tu DNI *</p>
          {resetPhoto ? (
            <div className="relative">
              <img src={resetPhoto} alt="DNI" className="w-full rounded-xl object-cover max-h-32" />
              <button onClick={() => setResetPhoto(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-4 rounded-xl border-2 border-dashed border-white/20 text-slate-400 text-sm hover:border-white/40 transition-colors flex items-center justify-center gap-2">
              📷 Tomar / Subir foto DNI
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
        </div>
        <input type="password" inputMode="numeric" maxLength={6} value={resetPin}
          onChange={e => setResetPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Nuevo PIN (4-6 dígitos)"
          className="w-full rounded-2xl px-4 py-4 text-base text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 placeholder:text-slate-500 tracking-widest transition-colors" />
        <input type="password" inputMode="numeric" maxLength={6} value={resetPinConfirm}
          onChange={e => setResetPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Confirmar nuevo PIN"
          className={`w-full rounded-2xl px-4 py-4 text-base text-white bg-white/5 border focus:outline-none focus:ring-2 placeholder:text-slate-500 tracking-widest transition-colors ${pinMismatch ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-400/50'}`} />
        {pinMismatch && <p className="text-sm text-red-400 -mt-2">Los PINs no coinciden</p>}
        <AnimatePresence>
          {resetError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{resetError}</motion.p>
          )}
        </AnimatePresence>
        <form onSubmit={handleSelfReset} className="flex gap-3">
          <button type="button" onClick={() => setStep('qr')}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
          <motion.button type="submit" disabled={!canSubmit || resetLoading} whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {resetLoading ? 'Guardando...' : 'Confirmar'}
          </motion.button>
        </form>
      </motion.div>
    )
  }

  // ── BALANCE ────────────────────────────────────────────────────────────────
  if (step === 'balance' && customer) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 p-2 bg-white rounded-xl shadow-lg">
              <QRCodeSVG value={customer.dni} size={80} bgColor="#ffffff" fgColor="#0a0f1e" level="M" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base leading-tight">{customer.full_name}</p>
              <p className="text-sm text-slate-400">DNI {customer.dni}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-3 rounded-xl bg-blue-400/8 border border-blue-400/20 text-center">
              <p className="text-2xl font-bold text-blue-300">{customer.glp_points.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">pts GLP</p>
            </div>
            <div className="px-3 py-3 rounded-xl bg-yellow-400/8 border border-yellow-400/20 text-center">
              <p className="text-2xl font-bold text-yellow-400">{customer.liquid_points.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">pts líquidos</p>
            </div>
          </div>

          {glpGoals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Progreso GLP</p>
              {glpGoals.map(goal => {
                const pct = Math.min(100, Math.round((customer.glp_points / goal.pointsRequired) * 100))
                const done = customer.glp_points >= goal.pointsRequired
                return (
                  <div key={goal.fuelType}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{goal.icon} {goal.label} {done && <span className="text-green-400 font-semibold">¡Listo!</span>}</span>
                      <span className="text-xs text-slate-500">{Math.min(customer.glp_points, goal.pointsRequired).toLocaleString()}/{goal.pointsRequired.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ backgroundColor: done ? '#22c55e' : goal.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {liquidGoals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Progreso Líquidos</p>
              {liquidGoals.map(goal => {
                const pct = Math.min(100, Math.round((customer.liquid_points / goal.pointsRequired) * 100))
                const done = customer.liquid_points >= goal.pointsRequired
                return (
                  <div key={goal.fuelType}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{goal.icon} {goal.label} {done && <span className="text-green-400 font-semibold">¡Listo!</span>}</span>
                      <span className="text-xs text-slate-500">{Math.min(customer.liquid_points, goal.pointsRequired).toLocaleString()}/{goal.pointsRequired.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ backgroundColor: done ? '#22c55e' : goal.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {annulments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Ajustes de puntos</p>
              {annulments.map(a => (
                <div key={a.id} className="px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/15">
                  <p className="text-xs text-red-400 font-medium">-{Math.abs(a.points_earned).toLocaleString()} pts {a.fuel_type}</p>
                  {a.notes && <p className="text-xs text-slate-400 mt-0.5">Motivo: {a.notes}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={handleReset} className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 transition-colors">
              Consultar otro DNI
            </button>
            {onClose && <button onClick={onClose} className="px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-colors">Cerrar</button>}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── QR + PIN GATE ──────────────────────────────────────────────────────────
  if (step === 'qr' && customer) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block">
              <QRCodeSVG value={customer.dni} size={160} bgColor="#ffffff" fgColor="#0a0f1e" level="M" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-base">{customer.full_name}</p>
              <p className="text-sm text-slate-400">DNI {customer.dni}</p>
            </div>
            <p className="text-xs text-slate-500 text-center">Muestra este QR al trabajador para acumular puntos</p>
          </div>

          {customer.has_pin ? (
            <div className="space-y-3 pt-1 border-t border-white/8">
              <p className="text-sm text-slate-400 text-center">Ingresa tu PIN para ver tu saldo</p>
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError('') }}
                  placeholder="Tu PIN (4-6 dígitos)"
                  autoFocus
                  className="w-full rounded-2xl px-4 py-4 text-base text-center text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 placeholder:text-slate-500 tracking-widest transition-colors"
                />
                <AnimatePresence>
                  {pinError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">
                      {pinError}
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.button type="submit" disabled={pinInput.length < 4 || pinLoading} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {pinLoading ? 'Verificando...' : 'Ver mi saldo'}
                </motion.button>
              </form>
              <button onClick={() => setStep('pin-reset')} className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1">
                ¿Olvidaste tu PIN? → Restablecerlo
              </button>
            </div>
          ) : (
            <button onClick={() => setStep('balance')}
              className="w-full py-3.5 rounded-2xl text-sm font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-900 transition-colors">
              Ver mi saldo
            </button>
          )}

          <button onClick={handleReset} className="w-full py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Buscar otro DNI
          </button>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── SEARCH ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">Ingresa tu DNI para ver tu QR y consultar tu saldo.</p>
      <form onSubmit={handleSearch} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          value={dni}
          onChange={e => { setDni(e.target.value.replace(/\D/g, '').slice(0, 8)); setError('') }}
          placeholder="DNI (8 dígitos)"
          className="w-full rounded-2xl px-4 py-4 text-base text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-slate-500 transition-colors"
        />
        <motion.button type="submit" disabled={dni.length !== 8 || loading} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-base font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Buscando...
            </>
          ) : 'Ver mi QR'}
        </motion.button>
      </form>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
