'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomerWithVehicles } from '@/lib/supabase'
import { FUEL_TYPES, POINTS_PER_SOL } from '@/lib/constants'
import { useRedemptionGoals } from '@/lib/useRedemptionGoals'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type SearchTab = 'dni' | 'nombre' | 'placa' | 'qr'
type Step = 'search' | 'register' | 'transaction' | 'success'

interface TransactionWizardProps {
  workerId: string
  workerName: string
  onClose: () => void
}

interface CustomerBasic {
  id: string
  dni: string
  full_name: string
  total_points: number
}

export default function TransactionWizard({ workerId, workerName, onClose }: TransactionWizardProps) {
  const REDEMPTION_GOALS = useRedemptionGoals()
  const [step, setStep] = useState<Step>('search')
  const [searchTab, setSearchTab] = useState<SearchTab>('dni')

  // Search state
  const [dniInput, setDniInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [plateInput, setPlateInput] = useState('')
  const [searchResults, setSearchResults] = useState<CustomerBasic[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Plate registration state
  const [showPlateReg, setShowPlateReg] = useState(false)
  const [plateRegDni, setPlateRegDni] = useState('')
  const [plateRegCustomer, setPlateRegCustomer] = useState<CustomerBasic | null>(null)
  const [plateRegSearching, setPlateRegSearching] = useState(false)
  const [plateRegError, setPlateRegError] = useState('')
  const [plateRegSaving, setPlateRegSaving] = useState(false)

  // Customer state
  const [customer, setCustomer] = useState<CustomerWithVehicles | null>(null)
  const [prefillDni, setPrefillDni] = useState('')

  // Register state
  const [regForm, setRegForm] = useState({ full_name: '', dni: '', phone: '', email: '' })
  const [registering, setRegistering] = useState(false)
  const [regError, setRegError] = useState('')

  // Transaction state
  const [txMode, setTxMode] = useState<'compra' | 'canje'>('compra')
  const [amount, setAmount] = useState('')
  const [fuelType, setFuelType] = useState('Regular')
  const [redeemFuel, setRedeemFuel] = useState('GLP')
  const [vehicleId, setVehicleId] = useState('')
  const [plateSearch, setPlateSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [txError, setTxError] = useState('')

  // Success state
  const [pointsEarned, setPointsEarned] = useState(0)
  const [newTotal, setNewTotal] = useState(0)
  const [successMode, setSuccessMode] = useState<'compra' | 'canje'>('compra')
  const [successFuel, setSuccessFuel] = useState('')

  const pointsPreview = Math.floor(parseFloat(amount || '0') * POINTS_PER_SOL)

  // Fetch full customer data
  const loadCustomer = useCallback(async (dni: string) => {
    const res = await fetch(`/api/customers?dni=${encodeURIComponent(dni)}`)
    if (res.ok) {
      const data = await res.json()
      setCustomer(data.customer)
      setVehicleId('')
      setPlateSearch('')
    }
  }, [])

  // Select a found customer
  const selectCustomer = (c: CustomerBasic) => {
    loadCustomer(c.dni)
    setStep('transaction')
  }

  // ── SEARCH HANDLERS ──────────────────────────────────────────────
  const searchByDni = async () => {
    if (dniInput.length !== 8) return
    setSearching(true)
    setSearchError('')
    const res = await fetch(`/api/customers?dni=${dniInput}`)
    if (res.status === 404) {
      setPrefillDni(dniInput)
      setRegForm(f => ({ ...f, dni: dniInput }))
      setStep('register')
    } else if (res.ok) {
      const data = await res.json()
      setCustomer(data.customer)
      setVehicleId('')
      setPlateSearch('')
      setStep('transaction')
    } else {
      setSearchError('Error al buscar')
    }
    setSearching(false)
  }

  const searchByName = async (val: string) => {
    setNameInput(val)
    if (val.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/customers/search?q=${encodeURIComponent(val)}&type=name`)
    if (res.ok) {
      const data = await res.json()
      setSearchResults(data.customers)
    }
    setSearching(false)
  }

  const searchByPlate = async () => {
    if (plateInput.length < 3) return
    setSearching(true)
    setSearchError('')
    const res = await fetch(`/api/customers/search?q=${encodeURIComponent(plateInput)}&type=plate`)
    if (res.ok) {
      const data = await res.json()
      if (data.customers.length === 0) {
        setSearchError('No se encontró ningún cliente con esa placa')
      } else {
        setSearchResults(data.customers)
      }
    }
    setSearching(false)
  }

  // ── REGISTER ─────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regForm.full_name.trim() || !regForm.dni) return
    setRegistering(true)
    setRegError('')
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dni: regForm.dni,
        full_name: regForm.full_name.trim(),
        phone: regForm.phone || null,
        email: regForm.email || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setRegError(data.error || 'Error'); setRegistering(false); return }
    setCustomer(data.customer)
    setVehicleId('')
    setStep('transaction')
    setRegistering(false)
  }

  // ── TRANSACTION ───────────────────────────────────────────────────
  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return
    if (txMode === 'compra' && (!amount || parseFloat(amount) <= 0)) return
    setSubmitting(true)
    setTxError('')

    // Auto-register plate if typed and not yet in customer's vehicles
    let finalVehicleId = vehicleId
    const upperPlate = plateSearch.toUpperCase()
    if (upperPlate.length >= 5 && !customer.vehicles.some(v => v.plate === upperPlate)) {
      const vRes = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customer.id, plate: upperPlate }),
      })
      if (vRes.ok) {
        const vData = await vRes.json()
        finalVehicleId = vData.vehicle.id
        setCustomer(prev => prev ? { ...prev, vehicles: [...prev.vehicles, vData.vehicle] } : prev)
        setVehicleId(vData.vehicle.id)
      }
    }

    const body = txMode === 'compra'
      ? { type: 'purchase', customer_id: customer.id, vehicle_id: finalVehicleId || null, amount_soles: parseFloat(amount), fuel_type: fuelType, worker_id: workerId || null }
      : { type: 'redemption', customer_id: customer.id, vehicle_id: finalVehicleId || null, fuel_type: redeemFuel, worker_id: workerId || null }

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setTxError(data.error || 'Error'); setSubmitting(false); return }

    setPointsEarned(txMode === 'compra' ? data.points_earned : data.points_redeemed)
    setNewTotal(data.new_total_points)
    setSuccessMode(txMode)
    setSuccessFuel(txMode === 'compra' ? fuelType : redeemFuel)
    setStep('success')
    setSubmitting(false)
  }

  const nextGoal = REDEMPTION_GOALS.find(g => g.pointsRequired > newTotal)

  return (
    <div className="min-h-[320px]">
      <AnimatePresence mode="wait">

        {/* ── STEP 1: SEARCH ─────────────────────────────────────────── */}
        {step === 'search' && (
          <motion.div key="search"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }} className="space-y-4"
          >
            <p className="text-sm text-slate-400">Busca al cliente por DNI, nombre o placa.</p>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
              {(['dni', 'nombre', 'placa', 'qr'] as SearchTab[]).map(tab => (
                <button key={tab} onClick={() => { setSearchTab(tab); setSearchResults([]); setSearchError('') }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${searchTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {tab === 'dni' ? 'DNI' : tab === 'nombre' ? 'Nombre' : tab === 'placa' ? 'Placa' : '📷 QR'}
                </button>
              ))}
            </div>

            {/* DNI tab */}
            {searchTab === 'dni' && (
              <div className="space-y-3">
                <Input label="DNI del cliente" placeholder="12345678"
                  value={dniInput}
                  onChange={e => { setDniInput(e.target.value.replace(/\D/g, '').slice(0, 8)); setSearchError('') }}
                  hint={`${dniInput.length}/8 dígitos`}
                />
                {searchError && <p className="text-sm text-red-400">{searchError}</p>}
                <Button variant="primary" size="lg" className="w-full"
                  disabled={dniInput.length !== 8} loading={searching}
                  onClick={searchByDni}>
                  Buscar
                </Button>
              </div>
            )}

            {/* Nombre tab */}
            {searchTab === 'nombre' && (
              <div className="space-y-3">
                <Input label="Nombre del cliente" placeholder="Ej: Juan Pérez"
                  value={nameInput}
                  onChange={e => searchByName(e.target.value)}
                />
                {searching && <p className="text-xs text-slate-500 animate-pulse">Buscando...</p>}
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-colors">
                        <div className="font-medium text-white text-sm">{c.full_name}</div>
                        <div className="text-xs text-slate-400">DNI: {c.dni} · {c.total_points.toLocaleString()} pts</div>
                      </button>
                    ))}
                  </div>
                )}
                {nameInput.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">Sin resultados</p>
                )}
              </div>
            )}

            {/* Placa tab */}
            {searchTab === 'placa' && (
              <div className="space-y-3">
                <Input label="Número de placa" placeholder="ABC-123"
                  value={plateInput}
                  onChange={e => { setPlateInput(e.target.value.toUpperCase()); setSearchResults([]); setSearchError(''); setShowPlateReg(false); setPlateRegCustomer(null); setPlateRegDni(''); setPlateRegError('') }}
                />
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map((c, i) => (
                      <button key={i} onClick={() => selectCustomer(c)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-colors">
                        <div className="font-medium text-white text-sm">{c.full_name}</div>
                        <div className="text-xs text-slate-400">DNI: {c.dni} · {c.total_points.toLocaleString()} pts</div>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="primary" size="lg" className="w-full"
                  disabled={plateInput.length < 3} loading={searching}
                  onClick={searchByPlate}>
                  Buscar por placa
                </Button>

                {/* Plate not found — registration section */}
                {searchError && !showPlateReg && (
                  <div className="pt-2 space-y-2">
                    <p className="text-sm text-red-400">{searchError}</p>
                    <button
                      type="button"
                      onClick={() => { setShowPlateReg(true); setSearchError('') }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      + Registrar placa a un cliente existente
                    </button>
                  </div>
                )}

                {showPlateReg && (
                  <div className="pt-2 border-t border-white/8 space-y-3">
                    <p className="text-xs text-slate-400 font-medium">Registrar placa <span className="text-white">{plateInput}</span> a un cliente:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        value={plateRegDni}
                        onChange={e => { setPlateRegDni(e.target.value.replace(/\D/g, '').slice(0, 8)); setPlateRegCustomer(null); setPlateRegError('') }}
                        placeholder="DNI del cliente"
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
                      />
                      <Button variant="secondary" size="sm"
                        disabled={plateRegDni.length !== 8} loading={plateRegSearching}
                        onClick={async () => {
                          setPlateRegSearching(true)
                          setPlateRegError('')
                          setPlateRegCustomer(null)
                          const res = await fetch(`/api/customers?dni=${plateRegDni}`)
                          if (res.status === 404) {
                            setPlateRegError('No se encontró ese DNI')
                          } else if (res.ok) {
                            const d = await res.json()
                            setPlateRegCustomer(d.customer)
                          } else {
                            setPlateRegError('Error al buscar')
                          }
                          setPlateRegSearching(false)
                        }}>
                        Buscar
                      </Button>
                    </div>
                    {plateRegError && <p className="text-sm text-red-400">{plateRegError}</p>}
                    {plateRegCustomer && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <p className="text-sm font-semibold text-white">{plateRegCustomer.full_name}</p>
                        <p className="text-xs text-slate-400">DNI: {plateRegCustomer.dni} · {plateRegCustomer.total_points.toLocaleString()} pts</p>
                        <Button variant="primary" size="sm" className="w-full" loading={plateRegSaving}
                          onClick={async () => {
                            setPlateRegSaving(true)
                            setPlateRegError('')
                            const res = await fetch('/api/vehicles', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ customer_id: plateRegCustomer.id, plate: plateInput }),
                            })
                            const d = await res.json()
                            if (!res.ok) {
                              setPlateRegError(d.error || 'Error al registrar placa')
                              setPlateRegSaving(false)
                              return
                            }
                            // Refresh customer and proceed to transaction
                            await loadCustomer(plateRegCustomer.dni)
                            setStep('transaction')
                            setPlateRegSaving(false)
                          }}>
                          Registrar placa y continuar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* QR tab */}
            {searchTab === 'qr' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Toma una foto del QR del cliente para buscar su DNI automáticamente.</p>
                <label className="flex flex-col items-center justify-center gap-3 px-4 py-6 rounded-xl border-2 border-dashed border-white/15 hover:border-blue-500/50 cursor-pointer transition-colors bg-white/3 hover:bg-white/5">
                  <span className="text-3xl">📷</span>
                  <span className="text-sm text-slate-400">Toca para abrir la cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setSearching(true)
                      setSearchError('')
                      const img = new Image()
                      const url = URL.createObjectURL(file)
                      img.onload = async () => {
                        const canvas = document.createElement('canvas')
                        canvas.width = img.width
                        canvas.height = img.height
                        const ctx = canvas.getContext('2d')
                        if (!ctx) { setSearchError('Error al procesar imagen'); setSearching(false); return }
                        // Scale down to max 1024px — jsQR fails on full-res mobile photos
                        const MAX = 1024
                        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
                        canvas.width = Math.round(img.width * scale)
                        canvas.height = Math.round(img.height * scale)
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                        const jsQR = (await import('jsqr')).default
                        const result = jsQR(imageData.data, imageData.width, imageData.height)
                        URL.revokeObjectURL(url)
                        if (!result) { setSearchError('No se detectó ningún QR. Intenta con mejor iluminación.'); setSearching(false); return }
                        const scannedDni = result.data.replace(/\D/g, '').slice(0, 8)
                        if (scannedDni.length !== 8) { setSearchError('QR inválido: no contiene un DNI de 8 dígitos.'); setSearching(false); return }
                        setDniInput(scannedDni)
                        const res = await fetch(`/api/customers?dni=${scannedDni}`)
                        if (res.status === 404) {
                          setPrefillDni(scannedDni)
                          setRegForm(f => ({ ...f, dni: scannedDni }))
                          setStep('register')
                        } else if (res.ok) {
                          const data = await res.json()
                          setCustomer(data.customer)
                          setVehicleId(data.customer.vehicles[0]?.id || '')
                          setStep('transaction')
                        } else {
                          setSearchError('Error al buscar cliente')
                        }
                        setSearching(false)
                      }
                      img.src = url
                    }}
                  />
                </label>
                {searching && <p className="text-xs text-slate-500 animate-pulse text-center">Procesando imagen...</p>}
                {searchError && <p className="text-sm text-red-400 text-center">{searchError}</p>}
              </div>
            )}

            {/* Register new shortcut */}
            <div className="pt-2 border-t border-white/5 text-center">
              <button onClick={() => { setPrefillDni(''); setRegForm({ full_name: '', dni: '', phone: '', email: '' }); setStep('register') }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                + Registrar cliente nuevo
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: REGISTER ───────────────────────────────────────── */}
        {step === 'register' && (
          <motion.div key="register"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}>
            <button onClick={() => setStep('search')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
              ← Volver
            </button>
            <h3 className="font-semibold text-white mb-4">Registrar nuevo cliente</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <Input label="Nombre completo *" placeholder="Juan Pérez"
                value={regForm.full_name}
                onChange={e => setRegForm(f => ({ ...f, full_name: e.target.value }))}
                autoFocus />
              <Input label="DNI *" placeholder="12345678"
                value={regForm.dni}
                onChange={e => setRegForm(f => ({ ...f, dni: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                maxLength={8} />
              <Input label="Teléfono (opcional)" placeholder="+51 999 000 000" type="tel"
                value={regForm.phone}
                onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
              <Input label="Correo (opcional)" placeholder="juan@email.com" type="email"
                value={regForm.email}
                onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
              {regError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{regError}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full"
                loading={registering}
                disabled={!regForm.full_name.trim() || regForm.dni.length !== 8}>
                Registrar y continuar
              </Button>
            </form>
          </motion.div>
        )}

        {/* ── STEP 3: TRANSACTION ────────────────────────────────────── */}
        {step === 'transaction' && customer && (
          <motion.div key="transaction"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}>
            <button onClick={() => setStep('search')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
              ← Cambiar cliente
            </button>

            {/* Customer info */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-white/5 border border-white/8">
              <div>
                <p className="font-semibold text-white text-sm">{customer.full_name}</p>
                <p className="text-xs text-slate-400">DNI: {customer.dni}</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold text-lg">{customer.total_points.toLocaleString()}</p>
                <p className="text-xs text-slate-500">puntos</p>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-4">
              <button type="button" onClick={() => { setTxMode('compra'); setTxError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${txMode === 'compra' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                💳 Compra
              </button>
              <button type="button" onClick={() => { setTxMode('canje'); setTxError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${txMode === 'canje' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                🎁 Canjear Puntos
              </button>
            </div>

            <form onSubmit={handleTransaction} className="space-y-4">
              {txMode === 'compra' ? (
                <>
                  {/* Amount */}
                  <Input label="Monto (S/)" type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    icon={<span className="text-slate-400 text-sm font-bold">S/</span>} />

                  {/* Points preview */}
                  <AnimatePresence>
                    {pointsPreview > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-yellow-400/8 border border-yellow-400/20">
                        <span className="text-sm text-slate-300">Puntos a sumar:</span>
                        <span className="text-lg font-bold text-yellow-400">+{pointsPreview.toLocaleString()} pts</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fuel type */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Tipo de combustible</label>
                    <div className="grid grid-cols-4 gap-2">
                      {FUEL_TYPES.map(ft => (
                        <button key={ft} type="button" onClick={() => setFuelType(ft)}
                          className={`py-2 text-sm font-medium rounded-xl border transition-colors ${fuelType === ft ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' : 'bg-white/4 border-white/10 text-slate-400 hover:bg-white/8'}`}>
                          {ft}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Redemption fuel selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 block">Selecciona qué canjear</label>
                    {REDEMPTION_GOALS.map(goal => {
                      const canRedeem = customer.total_points >= goal.pointsRequired
                      const selected = redeemFuel === goal.fuelType
                      return (
                        <button key={goal.fuelType} type="button"
                          disabled={!canRedeem}
                          onClick={() => setRedeemFuel(goal.fuelType)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
                            selected && canRedeem ? 'bg-green-600/20 border-green-500/50' :
                            canRedeem ? 'bg-white/4 border-white/10 hover:bg-white/8' :
                            'bg-white/2 border-white/5 opacity-40 cursor-not-allowed'
                          }`}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{goal.icon}</span>
                            <div>
                              <p className={`text-sm font-semibold ${selected && canRedeem ? 'text-green-300' : 'text-white'}`}>{goal.label}</p>
                              <p className="text-xs text-slate-500">{goal.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${canRedeem ? 'text-green-400' : 'text-slate-500'}`}>
                              {goal.pointsRequired.toLocaleString()} pts
                            </p>
                            {!canRedeem && (
                              <p className="text-xs text-slate-600">
                                faltan {(goal.pointsRequired - customer.total_points).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Vehicle plate input with autocomplete + auto-register */}
              {(() => {
                const upper = plateSearch.toUpperCase()
                const matches = customer.vehicles.filter(v => upper && v.plate.includes(upper))
                const selected = customer.vehicles.find(v => v.id === vehicleId)
                return (
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-1">Placa (opcional)</label>
                    <input
                      type="text"
                      value={plateSearch}
                      onChange={e => {
                        const val = e.target.value.toUpperCase()
                        setPlateSearch(val)
                        // Clear selection if user edits the plate
                        if (selected && val !== selected.plate) setVehicleId('')
                      }}
                      placeholder="Ej: ABC-123 o déjalo vacío"
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500 transition-colors"
                    />
                    {/* Suggestions list */}
                    {plateSearch && matches.length > 0 && (
                      <div className="mt-1 rounded-xl border border-white/10 overflow-hidden bg-navy-900/80">
                        {matches.map(v => (
                          <button key={v.id} type="button"
                            onClick={() => { setVehicleId(v.id); setPlateSearch(v.plate) }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${vehicleId === v.id ? 'bg-blue-600/30 text-blue-300' : 'text-slate-300 hover:bg-white/8'}`}>
                            🚗 {v.plate}
                            {vehicleId === v.id && <span className="text-xs text-blue-400 ml-auto">✓ seleccionado</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {plateSearch && upper.length >= 5 && matches.length === 0 && !customer.vehicles.some(v => v.plate === upper) && (
                      <p className="text-xs text-slate-500 mt-1">Placa nueva — se registrará automáticamente al guardar</p>
                    )}
                    {vehicleId && selected && (
                      <p className="text-xs text-blue-400 mt-1">Placa {selected.plate} seleccionada</p>
                    )}
                  </div>
                )
              })()}

              {txError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{txError}</p>}

              <Button type="submit"
                variant={txMode === 'compra' ? 'accent' : 'primary'}
                size="lg" className="w-full"
                loading={submitting}
                disabled={txMode === 'compra' ? (!amount || parseFloat(amount) <= 0) : !REDEMPTION_GOALS.find(g => g.fuelType === redeemFuel && customer.total_points >= g.pointsRequired)}>
                {txMode === 'compra' ? 'Registrar Carga' : `Confirmar Canje · ${redeemFuel}`}
              </Button>
            </form>
          </motion.div>
        )}

        {/* ── STEP 4: SUCCESS ────────────────────────────────────────── */}
        {step === 'success' && (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-center py-6 space-y-5">

            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 12 }}
              className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center text-4xl mx-auto">
              ✅
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-xl font-bold text-white mb-1">
                {successMode === 'compra' ? '¡Carga registrada!' : '¡Canje exitoso!'}
              </h3>
              <p className="text-slate-400 text-sm">
                Atendido por <span className="text-white font-medium">{workerName}</span>
              </p>
            </motion.div>

            {/* Points */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className={`p-4 rounded-2xl space-y-1 ${successMode === 'compra' ? 'bg-yellow-400/8 border border-yellow-400/20' : 'bg-green-500/8 border border-green-500/20'}`}>
              <p className={`text-3xl font-bold ${successMode === 'compra' ? 'text-yellow-400' : 'text-green-400'}`}>
                {successMode === 'compra' ? '+' : '-'}{pointsEarned.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">
                {successMode === 'compra' ? `puntos sumados a ${customer?.full_name}` : `puntos canjeados por ${successFuel} · ${customer?.full_name}`}
              </p>
              <div className={`mt-2 pt-2 border-t ${successMode === 'compra' ? 'border-yellow-400/10' : 'border-green-500/10'}`}>
                <p className="text-sm text-slate-300">
                  Nuevo total: <span className="font-bold text-white">{newTotal.toLocaleString()} pts</span>
                </p>
                {successMode === 'compra' && nextGoal && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Faltan {Math.max(0, nextGoal.pointsRequired - newTotal).toLocaleString()} pts para {nextGoal.label} gratis
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1"
                onClick={() => { setStep('search'); setCustomer(null); setAmount(''); setDniInput(''); setNameInput(''); setPlateInput(''); setSearchResults([]); setTxMode('compra'); setVehicleId(''); setPlateSearch('') }}>
                Nueva operación
              </Button>
              <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
                Cerrar
              </Button>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
