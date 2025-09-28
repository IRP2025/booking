'use client'

import { useEffect, useState } from 'react'

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')
  const [envStatus, setEnvStatus] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check if environment variables are available
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        setDebugInfo(`URL: ${supabaseUrl ? 'Found' : 'Missing'}, Key: ${supabaseAnonKey ? 'Found' : 'Missing'}`)
        
        if (!supabaseUrl || !supabaseAnonKey) {
          setEnvStatus('❌ Environment variables not found')
          setConnectionStatus('❌ Configuration Error')
          return
        }
        
        setEnvStatus('✅ Environment variables loaded')
        
        // Simple connection test without importing supabase client
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        })
        
        if (response.ok) {
          setConnectionStatus('✅ Connected to Supabase!')
        } else {
          setConnectionStatus(`❌ Connection failed: ${response.status}`)
        }
      } catch (err) {
        setConnectionStatus(`❌ Connection failed: ${err}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Test</h3>
      <p className="mb-2 text-sm text-gray-600">{debugInfo}</p>
      <p className="mb-2">{envStatus}</p>
      <p className="mb-2">{connectionStatus}</p>
    </div>
  )
}
