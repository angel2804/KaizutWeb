export const POINTS_PER_SOL = 1

export const REDEMPTION_GOALS = [
  {
    fuelType: 'GLP' as const,
    pointsRequired: 700,
    label: 'GLP',
    description: 'Gas Licuado de Petróleo',
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.1)',
    borderColor: 'rgba(249,115,22,0.3)',
    icon: '🔥',
  },
  {
    fuelType: 'Premium' as const,
    pointsRequired: 1000,
    label: 'Premium',
    description: 'Gasolina Premium 97 Oct.',
    color: '#2563EB',
    bgColor: 'rgba(37,99,235,0.1)',
    borderColor: 'rgba(37,99,235,0.3)',
    icon: '⭐',
  },
  {
    fuelType: 'Regular' as const,
    pointsRequired: 1100,
    label: 'Regular',
    description: 'Gasolina Regular 90 Oct.',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
    icon: '⛽',
  },
  {
    fuelType: 'Bio' as const,
    pointsRequired: 1200,
    label: 'Bio',
    description: 'Biodiésel B5',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
    icon: '🌿',
  },
] as const

export type FuelType = (typeof REDEMPTION_GOALS)[number]['fuelType']

export const FUEL_TYPES: FuelType[] = ['GLP', 'Premium', 'Regular', 'Bio']

export const DNI_LENGTH = 8
