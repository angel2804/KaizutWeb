'use client'

import { motion, type Variants } from 'framer-motion'
import Button from '@/components/ui/Button'

const titleWords = ['Combustible', 'de', 'calidad,', 'recompensas', 'reales.']

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const, delay },
  }),
}

const statsData = [
  { value: 'S/1', label: '= 1 Punto' },
  { value: '4', label: 'Tipos de combustible' },
  { value: '700+', label: 'Puntos para canjear' },
]

export default function Hero() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden hero-bg px-4 pt-16">
      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-red-600/10 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-700/8 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          Sistema de Puntos activo — Gana recompensas en cada carga
        </motion.div>

        {/* Animated headline */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
        >
          {titleWords.map((word, i) => (
            <motion.span
              key={i}
              variants={wordVariants}
              className={`inline-block mr-3 sm:mr-4 ${
                i === 3 || i === 4 ? 'gradient-text' : ''
              }`}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={0.85}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Acumula puntos en cada carga y canjéalos por{' '}
          <span className="text-yellow-400 font-semibold">galones gratis</span>.
          Válido para GLP, Premium, Regular y Bio.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          custom={1.1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => scrollTo('#servicios')}
            className="w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Ver Servicios
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => scrollTo('#empresas')}
            className="w-full sm:w-auto"
          >
            Para Empresas
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          custom={1.35}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
        >
          {statsData.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-slate-400 mt-0.5">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-red-400" />
        </motion.div>
      </motion.div>
    </section>
  )
}
