import { useState, useEffect } from 'react'
import { REDEMPTION_GOALS } from './constants'

// A mutable version of the goals type (without `as const` restrictions)
export type LiveGoal = {
  fuelType: string
  pointsRequired: number
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}

const staticGoals: LiveGoal[] = REDEMPTION_GOALS.map(g => ({ ...g }))

/** Returns REDEMPTION_GOALS merged with live thresholds from /api/settings. */
export function useRedemptionGoals(): LiveGoal[] {
  const [goals, setGoals] = useState<LiveGoal[]>(staticGoals)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setGoals(staticGoals.map(g => {
          const key = `points_${g.fuelType.toLowerCase()}`
          const live = data[key] ? parseInt(data[key], 10) : 0
          return live > 0 ? { ...g, pointsRequired: live } : { ...g }
        }))
      })
      .catch(() => {})
  }, [])

  return goals
}
