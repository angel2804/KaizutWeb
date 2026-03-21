'use client'

import { motion, type Variants } from 'framer-motion'
import { useRedemptionGoals } from '@/lib/useRedemptionGoals'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' as const, delay: i * 0.12 },
  }),
}

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function Services() {
  const REDEMPTION_GOALS = useRedemptionGoals()
  return (
    <section id="servicios" className="py-24 px-4 bg-navy-900/60">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <Badge color="red" className="mb-4 text-sm px-4 py-1.5">
            ⛽ Nuestros Combustibles
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Elige tu combustible,{' '}
            <span className="gradient-text-blue">acumula puntos</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Por cada sol gastado obtienes 1 punto. Canjéalos por un galón gratis cuando alcances la meta.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 text-sm text-slate-400"
        >
          {[
            { icon: '💳', text: 'Registra tu DNI' },
            { icon: '→', text: '', isArrow: true },
            { icon: '⛽', text: 'Carga combustible' },
            { icon: '→', text: '', isArrow: true },
            { icon: '🎯', text: 'Acumula S/1 = 1 punto' },
            { icon: '→', text: '', isArrow: true },
            { icon: '🎁', text: '¡Canjea gratis!' },
          ].map((step, i) =>
            step.isArrow ? (
              <span key={i} className="text-slate-600 hidden sm:block text-lg">→</span>
            ) : (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/4 border border-white/8">
                <span className="text-xl">{step.icon}</span>
                <span className="font-medium text-slate-300">{step.text}</span>
              </div>
            )
          )}
        </motion.div>

        {/* Fuel cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REDEMPTION_GOALS.map((fuel, i) => (
            <motion.div
              key={fuel.fuelType}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <Card
                hover
                glowColor={fuel.color + '44'}
                className="h-full flex flex-col"
                style={{ borderColor: fuel.borderColor }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                  style={{ background: fuel.bgColor, border: `1px solid ${fuel.borderColor}` }}
                >
                  {fuel.icon}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-1">{fuel.label}</h3>
                <p className="text-sm text-slate-400 mb-4">{fuel.description}</p>

                {/* Points badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: fuel.bgColor, color: fuel.color, border: `1px solid ${fuel.borderColor}` }}
                  >
                    S/1 = 1 punto
                  </span>
                </div>

                {/* Separator */}
                <div className="flex-1" />
                <div className="border-t border-white/5 pt-4 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Para canjear 1 galón</span>
                    <span className="font-bold text-sm" style={{ color: fuel.color }}>
                      {fuel.pointsRequired.toLocaleString()} pts
                    </span>
                  </div>
                  {/* Mini progress placeholder */}
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, (700 / fuel.pointsRequired) * 100)}%`, background: fuel.color }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
