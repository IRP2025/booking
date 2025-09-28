import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
