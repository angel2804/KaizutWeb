import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          dni: string
          full_name: string
          email: string | null
          phone: string | null
          total_points: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'total_points'> & { total_points?: number }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      vehicles: {
        Row: {
          id: string
          customer_id: string
          plate: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          customer_id: string
          vehicle_id: string | null
          amount_soles: number
          points_earned: number
          type: 'purchase' | 'redemption'
          fuel_type: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      corporate_contacts: {
        Row: {
          id: string
          name: string
          company: string
          email: string
          phone: string | null
          message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['corporate_contacts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['corporate_contacts']['Insert']>
      }
    }
  }
}

export type Customer = Database['public']['Tables']['customers']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type CorporateContact = Database['public']['Tables']['corporate_contacts']['Row']

export type CustomerWithVehicles = Customer & { vehicles: Vehicle[] }
