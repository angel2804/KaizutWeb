'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TransactionWizard from './TransactionWizard'

interface Worker {
  id: string
  name: string
}

const STORAGE_KEY = 'kaizut_worker'

export default function WorkerButton() {
  const [worker, setWorker] = useState<Worker | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showTxModal, setShowTxModal] = useState(false)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Restore worker session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setWorker(JSON.parse(saved))
    } catch {}
  }, [])

  const loginWorker = (w: Worker) => {
    setWorker(w)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(w)) } catch {}
  }

  const logoutWorker = () => {
    setWorker(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/worker-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'PIN incorrecto'); setLoading(false); return }
    loginWorker(data.worker)
    setPin('')
    setShowPinModal(false)
    setLoading(false)
  }

  const handleMainButton = () => {
    if (worker) setShowTxModal(true)
    else setShowPinModal(true)
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={handleMainButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold shadow-2xl transition-colors ${
          worker
            ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-900 shadow-yellow-400/30'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40'
        }`}
      >
        <AnimatePresence mode="wait">
          {worker ? (
            <motion.span key="worker"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2">
              <span className="text-lg">⛽</span>
              <span className="text-sm">Registrar · {worker.name}</span>
            </motion.span>
          ) : (
            <motion.span key="pin"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2">
              <span className="text-lg">🔑</span>
              <span className="text-sm">PIN Trabajador</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Logout chip (when worker logged in) */}
      <AnimatePresence>
        {worker && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            onClick={logoutWorker}
            className="fixed bottom-[4.5rem] right-6 z-40 px-3 py-1 rounded-full text-xs text-slate-400 bg-navy-900/80 border border-white/10 hover:text-white transition-colors"
          >
            Salir ({worker.name})
          </motion.button>
        )}
      </AnimatePresence>

      {/* PIN Modal */}
      <Modal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPin(''); setError('') }} title="Acceso Trabajador">
        <p className="text-sm text-slate-400 mb-5">Ingresa tu PIN para registrar cargas.</p>
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setError('') }}
            placeholder="••••"
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-600 transition-colors"
          />
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!pin}>
            Ingresar
          </Button>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        title={`Registrar carga · ${worker?.name ?? ''}`}
        maxWidth="lg"
      >
        {worker && (
          <TransactionWizard
            workerId={worker.id}
            workerName={worker.name}
            onClose={() => setShowTxModal(false)}
          />
        )}
      </Modal>
    </>
  )
}
