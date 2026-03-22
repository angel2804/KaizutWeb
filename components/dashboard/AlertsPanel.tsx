'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'

interface Alert {
  id: string
  alert_type: string | null
  vehicle_plate: string | null
  customer_name: string | null
  worker_name: string | null
  amount_soles: number | null
  reason: string | null
  created_at: string
  read_at: string | null
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' a las ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function alertMeta(type: string | null) {
  switch (type) {
    case 'high_amount':
      return { icon: '💰', label: 'Monto inusual', border: 'border-red-500/30', bg: 'bg-red-500/5', badge: 'bg-red-500/20 text-red-300 border border-red-500/30', text: 'text-red-400', desc: 'Se registró un monto superior al umbral configurado.' }
    case 'pin_reset':
      return { icon: '🔑', label: 'PIN restablecido (trabajador)', border: 'border-blue-500/30', bg: 'bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', text: 'text-blue-400', desc: 'Un trabajador restablecio el PIN del cliente.' }
    case 'pin_self_reset':
      return { icon: '📱', label: 'PIN restablecido (cliente)', border: 'border-purple-500/30', bg: 'bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', text: 'text-purple-400', desc: 'El cliente restablecio su PIN. Revisa la foto de DNI.' }
    default:
      return { icon: '⚠️', label: 'Vehículo duplicado', border: 'border-orange-500/30', bg: 'bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30', text: 'text-orange-400', desc: 'Esta placa ya tenia un registro de carga en las ultimas 2 horas.' }
  }
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
          <p className="text-sm text-slate-400">Montos inusuales, vehiculos duplicados y restablecimientos de PIN.</p>
        </div>
        {alerts.length > 0 && (
          <button onClick={markAllRead} disabled={marking}
            className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
            Marcar todas como leidas
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
          {alerts.map(alert => {
            const m = alertMeta(alert.alert_type)
            const photoUrl = alert.alert_type === 'pin_self_reset' && alert.reason?.startsWith('Foto DNI:')
              ? alert.reason.replace('Foto DNI: ', '')
              : null
            return (
              <Card key={alert.id} padding="md" className={`border ${m.border} ${m.bg}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{m.icon}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.badge}`}>{m.label}</span>
                      {alert.vehicle_plate && (
                        <span className="text-xs font-mono text-white bg-white/10 px-2 py-0.5 rounded-full">{alert.vehicle_plate}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
                      {alert.customer_name && <p>👤 Cliente: <span className="text-slate-200">{alert.customer_name}</span></p>}
                      {alert.worker_name && <p>👷 Trabajador: <span className="text-slate-200">{alert.worker_name}</span></p>}
                      {alert.amount_soles != null && alert.amount_soles > 0 && (
                        <p>💵 Monto: <span className="text-slate-200">S/ {Number(alert.amount_soles).toFixed(2)}</span></p>
                      )}
                      <p>🕐 Fecha: <span className={m.text}>{formatDateTime(alert.created_at)}</span></p>
                    </div>
                    {photoUrl ? (
                      <div className="text-xs bg-white/5 px-3 py-2 rounded-lg">
                        📷 <a href={photoUrl} target="_blank" rel="noopener noreferrer"
                          className="underline text-purple-300 hover:text-purple-200">Ver foto DNI del cliente</a>
                      </div>
                    ) : alert.reason && (
                      <div className="text-xs text-slate-300 bg-white/5 px-3 py-2 rounded-lg">
                        📝 Motivo: {alert.reason}
                      </div>
                    )}
                    <p className={`text-xs ${m.text}/70`}>{m.desc}</p>
                  </div>
                  <button onClick={() => markRead(alert.id)}
                    className="text-xs text-slate-500 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0">
                    ✓ Leida
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
