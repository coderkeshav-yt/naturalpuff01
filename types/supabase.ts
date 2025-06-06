export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: string
          payment_id: string | null
          customer_name: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status: string
          payment_id?: string | null
          customer_name?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: string
          payment_id?: string | null
          customer_name?: string | null
          email?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 