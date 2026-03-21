'use client'

import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useRedemptionGoals } from '@/lib/useRedemptionGoals'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const, delay: d } }),
}

interface CustomerResult {
  id: string
  dni: string
  full_name: string
  total_points: number
}

interface TxRow {
  id: string
  type: 'purchase' | 'redemption'
  fuel_type: string
  amount_soles: number
  points_earned: number
  created_at: string
  workers: { name: string } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function PointsChecker() {
  const REDEMPTION_GOALS = useRedemptionGoals()
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customer, setCustomer] = useState<CustomerResult | null>(null)
  const [history, setHistory] = useState<TxRow[]>([])
  const [showModal, setShowModal] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dni.length !== 8) return
    setLoading(true)
    setError('')
    setCustomer(null)
    setHistory([])

    const res = await fetch(`/api/customers?dni=${encodeURIComponent(dni)}`)
    if (res.status === 404) {
      setError('No encontramos una cuenta con ese DNI.')
      setLoading(false)
      return
    }
    if (!res.ok) {
      setError('Error al consultar. Intenta de nuevo.')
      setLoading(false)
      return
    }
    const data = await res.json()
    setCustomer(data.customer)

    // Fetch transaction history in parallel
    fetch(`/api/transactions?customer_id=${data.customer.id}`)
      .then(r => r.ok ? r.json() : { transactions: [] })
      .then(txData => setHistory(txData.transactions ?? []))

    setLoading(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setDni('')
    setCustomer(null)
    setHistory([])
  }

  return (
    <section id="puntos" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeUp} custom={0}
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-12"
        >
          <Badge color="red" className="mb-4 text-sm px-4 py-1.5">
            🎯 Mis Puntos
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Consulta tu{' '}
            <span className="text-red-400">saldo de puntos</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Ingresa tu DNI y mira cuántos puntos llevas acumulados y tu historial de cargas.
          </p>
        </motion.div>

        {/* Search form */}
        <motion.div
          variants={fadeUp} custom={0.1}
          initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          className="max-w-sm mx-auto"
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={dni}
              onChange={e => { setDni(e.target.value.replace(/\D/g, '').slice(0, 8)); setError('') }}
              placeholder="DNI (8 dígitos)"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-500 transition-colors"
            />
            <motion.button
              type="submit"
              disabled={dni.length !== 8 || loading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-3 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Ver puntos'}
            </motion.button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Results Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Mis Puntos" maxWidth="lg">
        {customer && (
          <div className="space-y-5">
            {/* Customer header + large QR */}
            <div className="flex items-center gap-5">
              {/* QR code — large for easy scanning */}
              <div className="flex-shrink-0 p-3 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={customer.dni}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0a0f1e"
                  level="M"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Cliente</p>
                <h3 className="text-lg font-bold text-white leading-tight">{customer.full_name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">DNI {customer.dni}</p>
                <div className="mt-3 px-4 py-3 rounded-xl bg-yellow-400/8 border border-yellow-400/20 text-center">
                  <p className="text-3xl font-bold text-yellow-400">{customer.total_points.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">puntos acumulados</p>
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Progreso de canje</p>
              {REDEMPTION_GOALS.map(goal => {
                const pct = Math.min(100, Math.round((customer.total_points / goal.pointsRequired) * 100))
                const done = customer.total_points >= goal.pointsRequired
                return (
                  <div key={goal.fuelType}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        {goal.icon} {goal.label}
                        {done && <span className="text-green-400 font-semibold ml-1">¡Listo para canjear!</span>}
                      </span>
                      <span className="text-slate-500">
                        {Math.min(customer.total_points, goal.pointsRequired).toLocaleString()} / {goal.pointsRequired.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: done ? '#22c55e' : goal.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Transaction history */}
            {history.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Historial</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {history.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{tx.type === 'purchase' ? '⛽' : '🎁'}</span>
                        <div>
                          <p className="text-xs font-medium text-white">
                            {tx.type === 'purchase' ? `Carga ${tx.fuel_type}` : `Canje ${tx.fuel_type}`}
                            {tx.workers?.name && <span className="text-slate-500 font-normal"> · {tx.workers.name}</span>}
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold flex-shrink-0 ${tx.type === 'purchase' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {tx.type === 'purchase' ? '+' : '-'}{tx.points_earned.toLocaleString()} pts
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
