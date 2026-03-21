import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kaizut — Estación de Servicio con Recompensas',
  description:
    'Acumula puntos en cada carga de combustible y canjéalos por galones gratis. GLP, Premium, Regular y Bio. Convenios para empresas.',
  keywords: ['gasolinera', 'grifo', 'combustible', 'puntos', 'recompensas', 'GLP', 'Peru'],
  openGraph: {
    title: 'Kaizut — Combustible de calidad, recompensas reales',
    description: 'S/1 gastado = 1 punto. Canjea tus puntos por galones gratis.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
