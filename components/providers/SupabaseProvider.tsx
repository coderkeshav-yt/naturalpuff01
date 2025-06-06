import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SupabaseContext = createContext({
  isInitialized: false,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Test the connection
        const { data, error } = await supabase.from('orders').select('count()', { count: 'exact' })
        if (error) throw error
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize Supabase:', error)
        // You might want to show an error UI here
      }
    }

    initializeSupabase()
  }, [])

  return (
    <SupabaseContext.Provider value={{ isInitialized }}>
      {isInitialized ? children : <LoadingState />}
    </SupabaseContext.Provider>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 