'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomerWithVehicles } from '@/lib/supabase'
import { FuelType } from '@/lib/constants'
import CustomerSearch from '@/components/dashboard/CustomerSearch'
import CustomerCard from '@/components/dashboard/CustomerCard'
import CreateCustomer from '@/components/dashboard/CreateCustomer'
import AddTransaction from '@/components/dashboard/AddTransaction'
import AddVehicle from '@/components/dashboard/AddVehicle'
import RedemptionPanel from '@/components/dashboard/RedemptionPanel'
import SetCustomerPin from '@/components/dashboard/SetCustomerPin'
import AnnulPointsModal from '@/components/dashboard/AnnulPointsModal'
import WorkerManager from '@/components/dashboard/WorkerManager'
import SettingsPanel from '@/components/dashboard/SettingsPanel'
import TransactionHistory from '@/components/dashboard/TransactionHistory'
import AlertsPanel from '@/components/dashboard/AlertsPanel'
import Modal from '@/components/ui/Modal'

type ModalType = 'transaction' | 'vehicle' | 'redemption' | 'create' | 'set-pin' | 'annul-points'
type Tab = 'clientes' | 'trabajadores' | 'historial' | 'alertas' | 'configuracion'

interface Toast { id: number; message: string }
let toastId = 0

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('clientes')
  const [customer, setCustomer] = useState<CustomerWithVehicles | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType | null>(null)
  const [createDni, setCreateDni] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    // Silent cleanup of old DNI photos and alerts
    fetch('/api/cleanup', { method: 'POST' }).catch(() => {})

    const fetchAlertCount = async () => {
      try {
        const res = await fetch('/api/alerts')
        if (res.ok) {
          const data = await res.json()
          setAlertCount((data.alerts ?? []).length)
        }
      } catch { /* ignore */ }
    }
    fetchAlertCount()
    const interval = setInterval(fetchAlertCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const addToast = (message: string) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const refreshCustomer = useCallback(async (dni: string) => {
    const res = await fetch(`/api/customers?dni=${encodeURIComponent(dni)}`)
    if (res.ok) { const data = await res.json(); setCustomer(data.customer) }
  }, [])

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'clientes', label: '👤 Clientes' },
    { id: 'trabajadores', label: '👷 Trabajadores' },
    { id: 'historial', label: '📋 Historial' },
    { id: 'alertas', label: '🔔 Alertas', badge: alertCount },
    { id: 'configuracion', label: '⚙️ Config' },
  ]

  return (
    <div className="space-y-6">
      {/* Page title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
        <p className="text-sm text-slate-400 mt-1">Gestiona clientes, transacciones y trabajadores.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
            {t.badge && t.badge > 0 ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── CLIENTES TAB ─── */}
      <AnimatePresence mode="wait">
        {tab === 'clientes' && (
          <motion.div key="clientes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="glass-card p-6">
              <CustomerSearch
                onCustomerFound={setCustomer}
                onCreateNew={dni => { setCreateDni(dni); setActiveModal('create') }}
              />
            </div>
            <AnimatePresence>
              {customer && (
                <CustomerCard key={customer.id} customer={customer} onAction={m => setActiveModal(m as ModalType)} />
              )}
            </AnimatePresence>
            {!customer && (
              <div className="text-center py-16 text-slate-600">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-slate-500">Busca un cliente por DNI</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TRABAJADORES TAB ─── */}
        {tab === 'trabajadores' && (
          <motion.div key="trabajadores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WorkerManager />
          </motion.div>
        )}

        {/* ── HISTORIAL TAB ─── */}
        {tab === 'historial' && (
          <motion.div key="historial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TransactionHistory />
          </motion.div>
        )}

        {/* ── ALERTAS TAB ─── */}
        {tab === 'alertas' && (
          <motion.div key="alertas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onAnimationStart={() => setAlertCount(0)}>
            <AlertsPanel />
          </motion.div>
        )}

        {/* ── CONFIGURACION TAB ─── */}
        {tab === 'configuracion' && (
          <motion.div key="configuracion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SettingsPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={activeModal === 'create'} onClose={() => setActiveModal(null)} title="Registrar Nuevo Cliente">
        <CreateCustomer initialDni={createDni} onSuccess={c => { setCustomer(c); setActiveModal(null); addToast(`✅ Cliente ${c.full_name} registrado`) }} />
      </Modal>
      <Modal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} title="Registrar Compra">
        {customer && <AddTransaction customerId={customer.id} vehicles={customer.vehicles}
          onSuccess={pts => { refreshCustomer(customer.dni); setActiveModal(null); addToast(`+${pts.toLocaleString()} puntos sumados`) }} />}
      </Modal>
      <Modal isOpen={activeModal === 'vehicle'} onClose={() => setActiveModal(null)} title="Agregar Vehículo">
        {customer && <AddVehicle customerId={customer.id}
          onSuccess={v => { refreshCustomer(customer.dni); setActiveModal(null); addToast(`🚗 Placa ${v.plate} registrada`) }} />}
      </Modal>
      <Modal isOpen={activeModal === 'redemption'} onClose={() => setActiveModal(null)} title="Canjear Puntos" maxWidth="lg">
        {customer && <RedemptionPanel
          customerId={customer.id}
          currentPoints={customer.total_points}
          has_pin={customer.has_pin}
          onSuccess={(ft: FuelType, pts: number) => { refreshCustomer(customer.dni); setActiveModal(null); addToast(`🎁 Canjeaste ${pts.toLocaleString()} pts por ${ft}`) }} />}
      </Modal>
      <Modal isOpen={activeModal === 'set-pin'} onClose={() => setActiveModal(null)} title="PIN de Seguridad">
        {customer && <SetCustomerPin
          customerId={customer.id}
          customerName={customer.full_name}
          hasPin={customer.has_pin}
          onSuccess={() => { refreshCustomer(customer.dni); setActiveModal(null); addToast(`🔒 PIN actualizado para ${customer.full_name}`) }} />}
      </Modal>
      <Modal isOpen={activeModal === 'annul-points'} onClose={() => setActiveModal(null)} title="Anular Puntos">
        {customer && <AnnulPointsModal
          customer={customer}
          onSuccess={() => { refreshCustomer(customer.dni); setActiveModal(null); addToast(`✂️ Puntos anulados para ${customer.full_name}`) }} />}
      </Modal>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
              className="glass-card px-4 py-3 text-sm text-white max-w-xs shadow-xl">
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
