'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface Worker {
  id: string
  name: string
  pin: string
  is_active: boolean
  created_at: string
}

export default function WorkerManager() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', pin: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visiblePins, setVisiblePins] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchWorkers = useCallback(async () => {
    const res = await fetch('/api/workers')
    if (res.ok) {
      const data = await res.json()
      setWorkers(data.workers)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchWorkers() }, [fetchWorkers])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.pin.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), pin: form.pin.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setSaving(false); return }
    setWorkers(prev => [...prev, data.worker])
    setForm({ name: '', pin: '' })
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este trabajador?')) return
    setDeletingId(id)
    await fetch(`/api/workers/${id}`, { method: 'DELETE' })
    setWorkers(prev => prev.filter(w => w.id !== id))
    setDeletingId(null)
  }

  const togglePin = (id: string) => {
    setVisiblePins(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Trabajadores</h2>
          <p className="text-sm text-slate-400">Gestiona los PINs de acceso de tu equipo.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Agregar trabajador'}
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card padding="md">
              <h3 className="text-sm font-semibold text-white mb-4">Nuevo trabajador</h3>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Nombre" placeholder="Ej: Ángel" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                  <Input label="PIN" placeholder="Ej: 5678" value={form.pin}
                    onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                    hint="Mínimo 4 caracteres" />
                </div>
                {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                <Button type="submit" variant="primary" loading={saving}
                  disabled={!form.name.trim() || form.pin.length < 4}>
                  Guardar trabajador
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workers list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card padding="md" className="text-center py-10">
          <p className="text-4xl mb-3">👷</p>
          <p className="text-slate-400 text-sm">No hay trabajadores aún. Agrega el primero.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {workers.map((w, i) => (
              <motion.div key={w.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}>
                <Card padding="sm" className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                      {w.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{w.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500">PIN:</span>
                        <span className="text-xs font-mono text-slate-300">
                          {visiblePins.has(w.id) ? w.pin : '•'.repeat(w.pin.length)}
                        </span>
                        <button onClick={() => togglePin(w.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {visiblePins.has(w.id)
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                            }
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button variant="danger" size="sm"
                    loading={deletingId === w.id}
                    onClick={() => handleDelete(w.id)}>
                    Eliminar
                  </Button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
