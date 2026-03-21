'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface TxRow {
  id: string
  type: 'purchase' | 'redemption'
  fuel_type: string
  amount_soles: number
  points_earned: number
  created_at: string
  customers: { full_name: string; dni: string } | null
  workers: { name: string } | null
}

type Filter = 'all' | 'purchase' | 'redemption'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/transactions')
    if (res.ok) {
      const data = await res.json()
      setTransactions(data.transactions ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  const totalPurchases = transactions.filter(t => t.type === 'purchase').length
  const totalRedemptions = transactions.filter(t => t.type === 'redemption').length
  const totalPointsIssued = transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.points_earned, 0)
  const totalPointsRedeemed = transactions.filter(t => t.type === 'redemption').reduce((s, t) => s + t.points_earned, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Historial de Transacciones</h2>
          <p className="text-sm text-slate-400">Todas las cargas y canjes registrados.</p>
        </div>
        <button onClick={fetchTransactions} className="text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
          ↻ Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cargas', value: totalPurchases.toLocaleString(), color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/20' },
          { label: 'Canjes', value: totalRedemptions.toLocaleString(), color: 'text-green-400', bg: 'bg-green-500/8 border-green-500/20' },
          { label: 'Puntos emitidos', value: totalPointsIssued.toLocaleString(), color: 'text-yellow-400', bg: 'bg-yellow-400/8 border-yellow-400/20' },
          { label: 'Puntos canjeados', value: totalPointsRedeemed.toLocaleString(), color: 'text-red-400', bg: 'bg-red-500/8 border-red-500/20' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border px-4 py-3 ${c.bg}`}>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        {(['all', 'purchase', 'redemption'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {f === 'all' ? 'Todos' : f === 'purchase' ? '⛽ Cargas' : '🎁 Canjes'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500">No hay transacciones registradas aún.</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
            >
              {/* Type icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                tx.type === 'purchase'
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-green-500/10 border border-green-500/20'
              }`}>
                {tx.type === 'purchase' ? '⛽' : '🎁'}
              </div>

              {/* Customer */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {tx.customers?.full_name ?? '—'}
                  <span className="text-slate-500 font-normal text-xs ml-1.5">DNI {tx.customers?.dni}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {tx.type === 'purchase' ? `Carga ${tx.fuel_type} · S/ ${tx.amount_soles.toFixed(2)}` : `Canje ${tx.fuel_type}`}
                  {tx.workers?.name && <span className="ml-1.5">· <span className="text-slate-400">{tx.workers.name}</span></span>}
                </p>
              </div>

              {/* Date */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs text-slate-400">{formatDate(tx.created_at)}</p>
              </div>

              {/* Points */}
              <div className="text-right flex-shrink-0 w-20">
                <p className={`text-sm font-bold ${tx.type === 'purchase' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {tx.type === 'purchase' ? '+' : '-'}{tx.points_earned.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">pts</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
