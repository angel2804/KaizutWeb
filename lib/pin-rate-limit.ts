import { SupabaseClient } from '@supabase/supabase-js'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 10 * 60 * 1000 // 10 minutes

export async function checkRateLimit(
  customerId: string,
  supabase: SupabaseClient
): Promise<{ blocked: boolean; secondsLeft?: number }> {
  const { data } = await supabase
    .from('pin_attempts')
    .select('count, locked_until')
    .eq('customer_id', customerId)
    .maybeSingle()

  if (!data) return { blocked: false }

  if (data.locked_until) {
    const lockedUntil = new Date(data.locked_until).getTime()
    const now = Date.now()
    if (now < lockedUntil) {
      return { blocked: true, secondsLeft: Math.ceil((lockedUntil - now) / 1000) }
    }
  }

  return { blocked: false }
}

export async function recordFailure(
  customerId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data } = await supabase
    .from('pin_attempts')
    .select('count')
    .eq('customer_id', customerId)
    .maybeSingle()

  const currentCount = data?.count ?? 0
  const newCount = currentCount + 1
  const lockedUntil = newCount >= MAX_ATTEMPTS
    ? new Date(Date.now() + LOCKOUT_MS).toISOString()
    : null

  await supabase
    .from('pin_attempts')
    .upsert({
      customer_id: customerId,
      count: newCount,
      locked_until: lockedUntil,
    })
}

export async function resetAttempts(
  customerId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('pin_attempts')
    .upsert({ customer_id: customerId, count: 0, locked_until: null })
}
