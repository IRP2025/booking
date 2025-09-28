import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return NextResponse.json({
    supabaseUrl: supabaseUrl ? 'Found' : 'Missing',
    supabaseAnonKey: supabaseAnonKey ? 'Found' : 'Missing',
    supabaseServiceRoleKey: supabaseServiceRoleKey ? 'Found' : 'Missing',
    urlValue: supabaseUrl,
    anonKeyValue: supabaseAnonKey ? 'Present' : 'Missing',
    serviceRoleKeyValue: supabaseServiceRoleKey ? 'Present' : 'Missing'
  })
}