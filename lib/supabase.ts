import { createClient } from '@supabase/supabase-js'

// These environment variables are required
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase configuration')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 