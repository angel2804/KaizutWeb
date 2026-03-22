'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

interface RegisteredCustomer {
  id: string
  dni: string
  full_name: string
  total_points: number
}

interface CustomerSelfRegisterProps {
  onClose?: () => void
}

export default function CustomerSelfRegister({ onClose }: CustomerSelfRegisterProps) {
  const [form, setForm] = useState({ full_name: '', dni: '', phone: '' })
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState<RegisteredCustomer | null>(null)

  const pinMismatch = confirmPin.length >= pin.length && pin !== confirmPin
  const canSubmit = form.full_name.trim().length >= 3 && form.dni.length === 8 && pin.length >= 4 && pin === confirmPin

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dni: form.dni,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: null,
        pin,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al registrarse')
    } else {
      setRegistered(data.customer)
    }
    setLoading(false)
  }

  const reset = () => {
    setRegistered(null)
    setForm({ full_name: '', dni: '', phone: '' })
    setPin('')
    setConfirmPin('')
    setError('')
    onClose?.()
  }

  if (registered) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-5 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-3xl mx-auto">
          ✅
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">¡Bienvenido/a, {registered.full_name.split(' ')[0]}!</h3>
          <p className="text-sm text-slate-400 mt-1">Ya eres parte del sistema de puntos.</p>
          <p className="text-xs text-slate-500 mt-1">Muestra este QR en el grifo para acumular puntos.</p>
        </div>

        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-xl inline-block">
            <QRCodeSVG
              value={registered.dni}
              size={160}
              bgColor="#ffffff"
              fgColor="#0a0f1e"
              level="M"
            />
          </div>
        </div>
        <p className="text-sm text-slate-400">DNI: <span className="text-white font-mono font-bold">{registered.dni}</span></p>

        <button
          onClick={reset}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white/8 hover:bg-white/12 text-slate-300 hover:text-white border border-white/10 transition-colors"
        >
          Cerrar
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Nombre completo *</label>
        <input
          type="text"
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          placeholder="Juan Pérez"
          autoFocus
          required
          className="w-full rounded-2xl px-4 py-3.5 text-base text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">DNI *</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          value={form.dni}
          onChange={e => { setForm(f => ({ ...f, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })); setError('') }}
          placeholder="12345678"
          className="w-full rounded-2xl px-4 py-3.5 text-base text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-500 transition-colors"
        />
        <p className="text-xs text-slate-600 mt-1 ml-1">{form.dni.length}/8 dígitos</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Teléfono <span className="text-slate-500 font-normal">(opcional)</span>
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="+51 999 000 000"
          className="w-full rounded-2xl px-4 py-3.5 text-base text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-500 transition-colors"
        />
      </div>

      {/* PIN — mandatory */}
      <div className="pt-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔒</span>
          <label className="text-sm font-medium text-slate-300">PIN de seguridad *</label>
        </div>
        <p className="text-xs text-slate-500 -mt-1">Se pedirá al momento de canjear puntos por galones.</p>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="4-6 dígitos  ••••"
          className="w-full rounded-2xl px-4 py-3.5 text-base text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-500 tracking-widest transition-colors"
        />

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={confirmPin}
          onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Confirmar PIN  ••••"
          className={`w-full rounded-2xl px-4 py-3.5 text-base text-white bg-white/5 border focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-500 tracking-widest transition-colors ${
            pinMismatch ? 'border-red-500/60' : 'border-white/10 focus:border-red-500/50'
          }`}
        />
        {pinMismatch && <p className="text-sm text-red-400">Los PINs no coinciden</p>}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={!canSubmit || loading}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-2xl text-base font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Registrando...
          </>
        ) : 'Crear mi cuenta'}
      </motion.button>
    </form>
  )
}
