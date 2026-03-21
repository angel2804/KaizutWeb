'use client'

import { motion, type Variants } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

const schema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  company: z.string().min(2, 'Empresa muy corta'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const benefits = [
  { icon: '🚗', title: 'Múltiples vehículos', desc: 'Todos los autos de tu empresa acumulan puntos bajo un solo RUC/DNI.' },
  { icon: '📊', title: 'Control centralizado', desc: 'Visualiza el consumo y puntos de toda tu flota en tiempo real.' },
  { icon: '💰', title: 'Ahorra en combustible', desc: 'Canjea los puntos acumulados por galones gratis para tu empresa.' },
  { icon: '🤝', title: 'Convenios especiales', desc: 'Negocia precios preferenciales según el volumen de consumo mensual.' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const, delay: d } }),
}

export default function ForEmpresas() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => { if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number) })
      .catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      const res = await fetch('/api/corporate-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al enviar')
      setSubmitted(true)
      reset()
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  return (
    <section id="empresas" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <Badge color="yellow" className="mb-4 text-sm px-4 py-1.5">
            🏢 Para Empresas
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Tu flota,{' '}
            <span className="text-yellow-400">nuestro compromiso</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Gestiona todos los vehículos de tu empresa y acumula puntos de forma centralizada.
            Convenios especiales para flotas grandes.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Benefits */}
          <motion.div
            variants={fadeUp}
            custom={0.1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-5"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Beneficios para tu empresa
            </h3>
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                custom={0.15 + i * 0.1}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Card hover padding="md" className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-xl flex-shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{b.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{b.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact form */}
          <motion.div
            variants={fadeUp}
            custom={0.2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card padding="lg">
              <h3 className="text-xl font-bold text-white mb-2">
                Solicitar Convenio
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Completa el formulario y te contactamos en menos de 24 horas.
              </p>

              {whatsappNumber && (
                <motion.a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, me interesa solicitar un convenio de combustible para mi empresa.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2.5 w-full py-3 mb-5 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-400 text-white transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Solicitar por WhatsApp
                </motion.a>
              )}

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl mx-auto">
                    ✅
                  </div>
                  <h4 className="text-lg font-semibold text-white">¡Mensaje enviado!</h4>
                  <p className="text-slate-400 text-sm">
                    Nos pondremos en contacto contigo a la brevedad.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Enviar otro mensaje
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Nombre completo *"
                      placeholder="Juan Pérez"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                    <Input
                      label="Empresa *"
                      placeholder="Transportes SAC"
                      error={errors.company?.message}
                      {...register('company')}
                    />
                  </div>
                  <Input
                    label="Correo electrónico *"
                    type="email"
                    placeholder="juan@empresa.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    label="Teléfono"
                    type="tel"
                    placeholder="+51 999 999 999"
                    {...register('phone')}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">
                      Mensaje (opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Cuéntanos sobre tu flota..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20 transition-colors resize-none"
                      {...register('message')}
                    />
                  </div>

                  {serverError && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      {serverError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    loading={isSubmitting}
                    className="w-full"
                  >
                    Solicitar Convenio
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
