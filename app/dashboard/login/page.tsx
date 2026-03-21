'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'PIN incorrecto')
        return
      }

      router.push(redirect)
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">PIN de acceso</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••••"
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-center text-xl tracking-widest text-white bg-white/5 border border-white/10 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20 transition-colors"
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center"
        >
          {error}
        </motion.p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={!pin}
        className="w-full"
      >
        Ingresar al Panel
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(37,99,235,0.5)] mx-auto mb-4">
            ⛽
          </div>
          <h1 className="text-2xl font-bold text-white">
            Kai<span className="text-yellow-400">zut</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Panel del Trabajador</p>
        </div>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-white mb-1">Acceso restringido</h2>
          <p className="text-sm text-slate-400 mb-6">Ingresa tu PIN para acceder al panel.</p>

          <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white/5" />}>
            <LoginForm />
          </Suspense>
        </Card>

        <p className="text-center text-sm text-slate-600 mt-6">
          <a href="/" className="text-slate-500 hover:text-slate-300 transition-colors">
            ← Volver al inicio
          </a>
        </p>
      </motion.div>
    </div>
  )
}
