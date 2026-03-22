'use client'

import { useState, useEffect } from 'react'
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

interface SavedBackup {
  id: string
  created_at: string
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

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  return (
    <div className="space-y-2">
      <input
        type="password"
        value={pw}
        onChange={e => { setPw(e.target.value); setErr('') }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            if (pw === 'angelccasa284') onUnlock()
            else setErr('Contraseña incorrecta')
          }
        }}
        placeholder="Contraseña de acceso"
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
      />
      {err && <p className="text-xs text-red-400">{err}</p>}
      <Button type="button" variant="secondary" size="sm" onClick={() => {
        if (pw === 'angelccasa284') onUnlock()
        else setErr('Contraseña incorrecta')
      }}>
        Desbloquear
      </Button>
    </div>
  )
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

  // Backup + Reset — all under one password gate
  const [backupUnlocked, setBackupUnlocked] = useState(false)
  const [backups, setBackups] = useState<SavedBackup[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [savingBackup, setSavingBackup] = useState(false)
  const [backupMsg, setBackupMsg] = useState('')
  const [backupErr, setBackupErr] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreMsg, setRestoreMsg] = useState('')
  const [restoreErr, setRestoreErr] = useState('')
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [resetErr, setResetErr] = useState('')

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

  const loadBackups = async () => {
    setBackupsLoading(true)
    const res = await fetch('/api/backup')
    if (res.ok) {
      const d = await res.json()
      setBackups(d.backups ?? [])
    }
    setBackupsLoading(false)
  }

  const handleBackupUnlock = () => {
    setBackupUnlocked(true)
    loadBackups()
  }

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
  }

  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const saveBackup = async () => {
    setSavingBackup(true)
    setBackupMsg('')
    setBackupErr('')
    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', password: 'angelccasa284' }),
    })
    const d = await res.json()
    if (!res.ok) {
      setBackupErr(d.error || 'Error al guardar backup')
    } else {
      setBackupMsg('✅ Backup guardado')
      setTimeout(() => setBackupMsg(''), 3000)
      await loadBackups()
    }
    setSavingBackup(false)
  }

  const restoreBackup = async (id: string) => {
    setRestoringId(id)
    setRestoreMsg('')
    setRestoreErr('')
    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore', password: 'angelccasa284', backup_id: id }),
    })
    const d = await res.json()
    if (!res.ok) {
      setRestoreErr(d.error || 'Error al restaurar')
    } else {
      setRestoreMsg(`✅ Restaurado: ${d.restored.customers} clientes, ${d.restored.transactions} transacciones`)
    }
    setRestoringId(null)
  }

  const handleReset = async () => {
    setResetting(true)
    setResetErr('')
    setResetMsg('')
    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', password: 'angelccasa284' }),
    })
    const d = await res.json()
    if (!res.ok) { setResetErr(d.error || 'Error al resetear') }
    else { setResetMsg('✅ Base de datos limpiada. Los trabajadores se conservaron.') }
    setResetting(false)
    setResetConfirm(false)
  }

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
            <label className="inline-block cursor-pointer">
              <span className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:border-white/30 transition-colors">
                {logoUploading ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
            </label>
            {logoError && <p className="text-xs text-red-400">{logoError}</p>}
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

      {/* Backup + Reset — password protected */}
      <Card padding="md" className="space-y-4 border border-blue-500/20">
        <div>
          <h3 className="text-sm font-semibold text-blue-300">🔐 Backup y gestión de datos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Guarda copias de seguridad en la nube (máx. 3), restaura o limpia la base de datos. Requiere contraseña.
          </p>
        </div>

        {!backupUnlocked ? (
          <PasswordGate onUnlock={handleBackupUnlock} />
        ) : (
          <div className="space-y-6">

            {/* Backups list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-medium text-slate-300">Backups guardados</p>
                <Button type="button" variant="secondary" size="sm" loading={savingBackup} onClick={saveBackup}>
                  💾 Crear backup ahora
                </Button>
              </div>

              {backupMsg && <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{backupMsg}</p>}
              {backupErr && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{backupErr}</p>}

              {backupsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-12 rounded-lg bg-white/4 animate-pulse" />)}
                </div>
              ) : backups.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No hay backups guardados aún.</p>
              ) : (
                <div className="space-y-2">
                  {backups.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/4 border border-white/8">
                      <div>
                        <p className="text-xs font-medium text-white">Backup #{backups.length - i}</p>
                        <p className="text-xs text-slate-500">{formatDate(b.created_at)}</p>
                      </div>
                      <Button
                        type="button" variant="secondary" size="sm"
                        loading={restoringId === b.id}
                        onClick={() => restoreBackup(b.id)}
                      >
                        Restaurar
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {restoreMsg && <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{restoreMsg}</p>}
              {restoreErr && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{restoreErr}</p>}
            </div>

            <div className="border-t border-white/8" />

            {/* Reset section */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-red-400">🗑️ Entregar sistema limpio</p>
                <p className="text-xs text-slate-500 mt-0.5">Elimina clientes, transacciones, vehículos y alertas. Los trabajadores y configuraciones se conservan.</p>
              </div>
              {resetMsg && <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{resetMsg}</p>}
              {resetErr && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{resetErr}</p>}
              {!resetConfirm ? (
                <Button type="button" variant="primary" size="sm" onClick={() => setResetConfirm(true)}>
                  Resetear base de datos
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-400 font-medium">¿Confirmas? Se eliminarán todos los clientes, transacciones y vehículos.</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="primary" size="sm" loading={resetting} onClick={handleReset}>
                      Sí, resetear todo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setResetConfirm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={() => setBackupUnlocked(false)}>
              Cerrar sección
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
