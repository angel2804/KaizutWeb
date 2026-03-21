'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomerWithVehicles } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface CustomerSearchProps {
  onCustomerFound: (customer: CustomerWithVehicles | null) => void
  onCreateNew: (dni: string) => void
}

export default function CustomerSearch({ onCustomerFound, onCreateNew }: CustomerSearchProps) {
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dni.length !== 8) return
    setLoading(true)
    setNotFound(false)
    setError('')

    try {
      const res = await fetch(`/api/customers?dni=${encodeURIComponent(dni)}`)
      const data = await res.json()

      if (res.status === 404) {
        setNotFound(true)
        onCustomerFound(null)
      } else if (!res.ok) {
        setError(data.error || 'Error al buscar')
      } else {
        onCustomerFound(data.customer)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setDni('')
    setNotFound(false)
    setError('')
    onCustomerFound(null)
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Buscar cliente por DNI"
            placeholder="12345678"
            value={dni}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 8)
              setDni(v)
              if (notFound) setNotFound(false)
              if (error) setError('')
            }}
            maxLength={8}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            rightIcon={
              dni && (
                <button type="button" onClick={handleClear} className="hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
            }
            hint={`${dni.length}/8 dígitos`}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={dni.length !== 8}
          loading={loading}
          className="mt-6 self-start"
        >
          Buscar
        </Button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
          >
            {error}
          </motion.p>
        )}

        {notFound && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center justify-between bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3"
          >
            <span className="text-sm text-slate-400">
              No se encontró cliente con DNI <span className="text-white font-medium">{dni}</span>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCreateNew(dni)}
            >
              + Registrar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
