'use client'

import { useState, useEffect } from 'react'

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.company_logo_url) setLogoUrl(data.company_logo_url)
        if (data.company_name) setCompanyName(data.company_name)
      })
      .catch(() => {})
  }, [])

  const displayName = companyName || 'Kaizut'

  return (
    <footer className="bg-navy-900/80 border-t border-white/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(37,99,235,0.4)] flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <span>⛽</span>
                }
              </div>
              <span className="font-bold text-lg text-white">
                {companyName
                  ? companyName
                  : <>Kai<span className="text-yellow-400">zut</span></>
                }
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Tu estación de servicio de confianza. Calidad, precio justo y recompensas reales en cada carga.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Servicios</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><a href="#servicios" className="hover:text-slate-300 transition-colors">GLP</a></li>
              <li><a href="#servicios" className="hover:text-slate-300 transition-colors">Premium</a></li>
              <li><a href="#servicios" className="hover:text-slate-300 transition-colors">Regular</a></li>
              <li><a href="#servicios" className="hover:text-slate-300 transition-colors">Bio</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <span>📍</span> Lima, Perú
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> +51 999 000 000
              </li>
              <li className="flex items-center gap-2">
                <span>📧</span> info@kaizut.pe
              </li>
              <li>
                <a href="#puntos" className="text-blue-400 hover:text-blue-300 transition-colors">
                  🎯 Consultar mis puntos →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} {displayName}. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ en Perú</p>
        </div>
      </div>
    </footer>
  )
}
