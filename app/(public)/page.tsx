import Hero from '@/components/landing/Hero'
import Services from '@/components/landing/Services'
import PointsChecker from '@/components/landing/PointsChecker'
import ForEmpresas from '@/components/landing/ForEmpresas'
import WorkerButton from '@/components/landing/WorkerButton'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <PointsChecker />
      <ForEmpresas />
      <WorkerButton />
    </>
  )
}
