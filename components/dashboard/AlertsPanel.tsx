'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'

interface Alert {
  id: string
  vehicle_plate: string
  customer_name: string
  worker_name: string | null
  amount_soles: number
  created_at: string
  read_at: string | null
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' a las ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const fetchAlerts = useCallback(async () => {
    const res = await fetch('/api/alerts')
    if (res.ok) {
      const data = await res.json()
      setAlerts(data.alerts ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const markAllRead = async () => {
    setMarking(true)
    await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setAlerts([])
    setMarking(false)
  }

  const markRead = async (id: string) => {
    await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/4 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Alertas de seguridad</h2>
          <p className="text-sm text-slate-400">Registros sospechosos: misma placa usada en menos de 2 horas.</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card padding="md" className="text-center py-10">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-slate-400 text-sm">Sin alertas pendientes</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <Card key={alert.id} padding="md" className="border border-orange-500/30 bg-orange-500/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 text-lg">⚠️</span>
                    <p className="text-sm font-bold text-white">
                      Registro duplicado — Placa <span className="text-orange-300 font-mono">{alert.vehicle_plate}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
                    <p>👤 Cliente: <span className="text-slate-200">{alert.customer_name}</span></p>
                    <p>👷 Trabajador: <span className="text-slate-200">{alert.worker_name ?? 'desconocido'}</span></p>
                    <p>💰 Monto: <span className="text-slate-200">S/ {Number(alert.amount_soles).toFixed(2)}</span></p>
                    <p>🕐 Fecha y hora: <span className="text-orange-300">{formatDateTime(alert.created_at)}</span></p>
                  </div>
                  <p className="text-xs text-orange-400/70">
                    Esta placa ya tenía un registro de carga en las últimas 2 horas.
                  </p>
                </div>
                <button
                  onClick={() => markRead(alert.id)}
                  className="text-xs text-slate-500 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  ✓ Leída
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
