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

export default function CustomerSelfRegister() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', dni: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState<RegisteredCustomer | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || form.dni.length !== 8) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dni: form.dni,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
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
    setForm({ full_name: '', dni: '', phone: '', email: '' })
    setError('')
    setOpen(false)
  }

  return (
    <div className="max-w-sm mx-auto mt-6">
      {!open && !registered && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpen(true)}
          className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 text-sm text-slate-300 hover:text-white transition-colors text-center"
        >
          ¿No eres cliente? <span className="text-red-400 font-semibold">Regístrate en nuestro sistema →</span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && !registered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 rounded-2xl bg-white/4 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Crear cuenta de puntos</h3>
                <button onClick={() => { setOpen(false); setError('') }} className="text-slate-500 hover:text-white text-xs transition-colors">✕ Cerrar</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Juan Pérez"
                    required
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">DNI *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={form.dni}
                    onChange={e => { setForm(f => ({ ...f, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })); setError('') }}
                    placeholder="12345678"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-500 transition-colors"
                  />
                  <p className="text-xs text-slate-600 mt-0.5">{form.dni.length}/8 dígitos</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono <span className="text-slate-600">(opcional)</span></label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+51 999 000 000"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Correo electrónico <span className="text-slate-600">(opcional)</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="juan@email.com"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={!form.full_name.trim() || form.dni.length !== 8 || loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  {loading ? 'Registrando...' : 'Crear mi cuenta'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {registered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-5 rounded-2xl bg-white/4 border border-green-500/20 space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-2xl mx-auto">
              ✅
            </div>
            <div>
              <h3 className="font-bold text-white text-base">¡Bienvenido/a, {registered.full_name.split(' ')[0]}!</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ya eres parte del sistema de puntos. Muestra este QR al grifo.</p>
            </div>

            {/* QR */}
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
                <QRCodeSVG
                  value={registered.dni}
                  size={140}
                  bgColor="#ffffff"
                  fgColor="#0a0f1e"
                  level="M"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">DNI: <span className="text-white font-mono">{registered.dni}</span></p>

            <button onClick={reset} className="text-xs text-slate-500 hover:text-white transition-colors underline">
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
