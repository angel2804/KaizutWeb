'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface Settings {
  company_name: string
  whatsapp_number: string
  points_glp: string
  points_premium: string
  points_regular: string
  points_bio: string
  points_enabled: string
}

const defaultSettings: Settings = {
  company_name: '',
  whatsapp_number: '',
  points_glp: '700',
  points_premium: '1000',
  points_regular: '1100',
  points_bio: '1200',
  points_enabled: 'true',
}

export default function SettingsPanel() {
  const [form, setForm] = useState<Settings>(defaultSettings)
  const [logoUrl, setLogoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [cleaning, setCleaning] = useState(false)
  const [cleanConfirm, setCleanConfirm] = useState(false)
  const [cleanSuccess, setCleanSuccess] = useState(false)
  const [cleanError, setCleanError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          company_name: data.company_name ?? '',
          whatsapp_number: data.whatsapp_number ?? '',
          points_glp: data.points_glp ?? '700',
          points_premium: data.points_premium ?? '1000',
          points_regular: data.points_regular ?? '1100',
          points_bio: data.points_bio ?? '1200',
          points_enabled: data.points_enabled ?? 'true',
        })
        if (data.company_logo_url) setLogoUrl(data.company_logo_url)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al guardar')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setLogoError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/settings/logo', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) {
      setLogoError(data.error || 'Error al subir logo')
    } else {
      setLogoUrl(data.url)
    }
    setLogoUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Configuración</h2>
        <p className="text-sm text-slate-400">Personaliza el nombre, logo, contacto y puntos de canje.</p>
      </div>

      {/* Logo upload */}
      <Card padding="md" className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Logo del grifo</h3>
        <div className="flex items-center gap-5">
          {/* Preview */}
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-3xl">⛽</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-slate-400">
              Sube el logo de tu grifo (PNG, JPG, WebP). Se mostrará en el encabezado y pie de página.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={logoUploading}
              onClick={() => fileRef.current?.click()}
            >
              {logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            {logoError && <p className="text-xs text-red-400">{logoError}</p>}
            {logoUploading && <p className="text-xs text-slate-500 animate-pulse">Subiendo imagen...</p>}
            {logoUrl && !logoUploading && <p className="text-xs text-green-400">✅ Logo actualizado</p>}
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Empresa */}
        <Card padding="md" className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Información de la empresa</h3>
          <Input
            label="Nombre de la empresa"
            placeholder="Grifo Kaizut"
            value={form.company_name}
            onChange={set('company_name')}
          />
          <Input
            label="Número de WhatsApp"
            placeholder="51999999999 (con código de país, sin +)"
            value={form.whatsapp_number}
            onChange={set('whatsapp_number')}
            hint="Ejemplo: 51987654321"
          />
        </Card>

        {/* Sistema de Puntos toggle */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Sistema de Puntos</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {form.points_enabled === 'true'
                  ? 'Activo — los clientes acumulan puntos en cada carga'
                  : 'Inactivo — no se acumulan ni canjean puntos'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, points_enabled: f.points_enabled === 'true' ? 'false' : 'true' }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                form.points_enabled === 'true' ? 'bg-red-600' : 'bg-white/10'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  form.points_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Puntos de canje */}
        <Card padding="md" className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Puntos requeridos para canje</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="🔥 GLP" type="number" min="1" value={form.points_glp} onChange={set('points_glp')} hint="puntos para galón gratis" />
            <Input label="⭐ Premium" type="number" min="1" value={form.points_premium} onChange={set('points_premium')} hint="puntos para galón gratis" />
            <Input label="⛽ Regular" type="number" min="1" value={form.points_regular} onChange={set('points_regular')} hint="puntos para galón gratis" />
            <Input label="🌿 Bio" type="number" min="1" value={form.points_bio} onChange={set('points_bio')} hint="puntos para galón gratis" />
          </div>
        </Card>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
        {success && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">✅ Configuración guardada correctamente</p>}

        <Button type="submit" variant="primary" loading={saving}>
          Guardar cambios
        </Button>
      </form>

      {/* Developer zone */}
      <Card padding="md" className="space-y-4 border border-red-500/20">
        <div>
          <h3 className="text-sm font-semibold text-red-400">⚠️ Zona de desarrollador</h3>
          <p className="text-xs text-slate-500 mt-0.5">Limpiar toda la base de datos de clientes, transacciones y vehículos. Los trabajadores y configuraciones se conservan.</p>
        </div>
        {cleanSuccess && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">✅ Base de datos limpiada correctamente</p>}
        {cleanError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{cleanError}</p>}
        {!cleanConfirm ? (
          <Button type="button" variant="secondary" size="sm"
            onClick={() => setCleanConfirm(true)}>
            🗑️ Limpiar base de datos
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-400 font-medium">¿Estás seguro? Esto eliminará todos los clientes, vehículos y transacciones.</p>
            <div className="flex gap-2">
              <Button type="button" variant="primary" size="sm" loading={cleaning}
                onClick={async () => {
                  setCleaning(true)
                  setCleanError('')
                  setCleanSuccess(false)
                  const res = await fetch('/api/dev/clean', { method: 'POST' })
                  const d = await res.json()
                  if (!res.ok) {
                    setCleanError(d.error || 'Error al limpiar')
                  } else {
                    setCleanSuccess(true)
                    setTimeout(() => setCleanSuccess(false), 4000)
                  }
                  setCleanConfirm(false)
                  setCleaning(false)
                }}>
                Sí, limpiar todo
              </Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => setCleanConfirm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
