'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import VerPuntosDropdown from '@/components/landing/VerPuntosDropdown'
import CustomerSelfRegister from '@/components/landing/CustomerSelfRegister'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showPuntosModal, setShowPuntosModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.company_logo_url) setLogoUrl(data.company_logo_url)
        if (data.company_name) setCompanyName(data.company_name)
      })
      .catch(() => {})
  }, [])

  const handleNavClick = (href: string) => {
    setMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const openLoginModal = () => {
    setMenuOpen(false)
    setUsername('')
    setPassword('')
    setLoginError('')
    setShowLoginModal(true)
  }

  const openPuntos = () => {
    setMenuOpen(false)
    setShowPuntosModal(true)
  }

  const openRegister = () => {
    setMenuOpen(false)
    setShowRegisterModal(true)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error || 'Credenciales incorrectas')
        setLoginLoading(false)
        return
      }
      setShowLoginModal(false)
      router.push('/dashboard')
    } catch {
      setLoginError('Error de conexión')
      setLoginLoading(false)
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-navy-900/90 backdrop-blur-md border-b border-white/5 shadow-lg' : ''
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 max-w-[140px] object-contain flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(220,38,38,0.5)] group-hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] transition-shadow flex-shrink-0">
                <span>⛽</span>
              </div>
            )}
            <span className="font-bold text-lg text-white tracking-tight">
              {companyName || (<>Kai<span className="text-yellow-400">zut</span></>)}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            <button onClick={() => handleNavClick('#servicios')} className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              Servicios
            </button>
            <button onClick={() => handleNavClick('#empresas')} className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              Para Empresas
            </button>
            <button onClick={openLoginModal} className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              Iniciar Sesión
            </button>
            <button onClick={() => handleNavClick('#empresas')} className="px-3 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded-lg transition-colors ml-1">
              Contactar
            </button>
          </div>

          {/* Mobile: hamburger only (Ver Puntos + Registrarse are floating pills) */}
          <div className="flex md:hidden items-center">
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-400"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-navy-900/95 backdrop-blur-md border-b border-white/5 overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                <button onClick={() => handleNavClick('#servicios')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                  Servicios
                </button>
                <button onClick={() => handleNavClick('#empresas')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                  Para Empresas
                </button>
                <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-2">
                  <button onClick={openLoginModal} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                    Iniciar Sesión (Admin)
                  </button>
                  <button onClick={() => handleNavClick('#empresas')} className="px-4 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded-xl transition-colors">
                    Contactar
                  </button>
                </div>
                <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-2">
                  <button onClick={openPuntos} className="px-4 py-3 text-sm font-semibold text-slate-900 bg-yellow-400 hover:bg-yellow-300 rounded-xl transition-colors flex items-center gap-2">
                    <span>🔳</span> Ver QR
                  </button>
                  <button onClick={openRegister} className="px-4 py-3 text-sm font-semibold text-slate-900 bg-yellow-400 hover:bg-yellow-300 rounded-xl transition-colors flex items-center gap-2">
                    <span>📋</span> Registrarse
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Floating customer action pills — bottom left */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 items-start">
        <motion.button
          onClick={openRegister}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-semibold shadow-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 shadow-yellow-400/30 transition-colors"
        >
          <span className="text-lg">📋</span>
          <span className="text-sm">Registrarse</span>
        </motion.button>
        <motion.button
          onClick={openPuntos}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-semibold shadow-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 shadow-yellow-400/30 transition-colors"
        >
          <span className="text-lg">🔳</span>
          <span className="text-sm">Ver QR</span>
        </motion.button>
      </div>

      {/* Ver QR Modal — mobile sheet */}
      <Modal
        isOpen={showPuntosModal}
        onClose={() => setShowPuntosModal(false)}
        title="Ver QR y Puntos"
        mobileSheet
      >
        <VerPuntosDropdown onClose={() => setShowPuntosModal(false)} />
      </Modal>

      {/* Registrarse Modal — mobile sheet */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Crear cuenta de puntos"
        mobileSheet
      >
        <CustomerSelfRegister onClose={() => setShowRegisterModal(false)} />
      </Modal>

      {/* Admin Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Acceso Administrador">
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setLoginError('') }}
                placeholder="admin"
                autoFocus
                autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>
          <AnimatePresence>
            {loginError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center"
              >
                {loginError}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.button
            type="submit"
            disabled={!username || !password || loginLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loginLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {loginLoading ? 'Verificando...' : 'Entrar al panel'}
          </motion.button>
        </form>
      </Modal>
    </>
  )
}
