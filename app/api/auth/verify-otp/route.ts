// src/app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { otp } = await request.json()

    // Get session instead of user directly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('Session error or no session:', sessionError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    
    // Log for debugging
    console.log('Session found:', {
      userId: user.id,
      email: user.email
    })

    // Verify OTP
    const { data: otpData, error: otpError } = await supabase
      .from('two_fa_codes')
      .select()
      .eq('user_id', user.id)
      .eq('otp_code', otp)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpData) {
      console.log('OTP verification failed:', otpError)
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    // Mark OTP as used
    const { error: updateOtpError } = await supabase
      .from('two_fa_codes')
      .update({ is_used: true })
      .eq('id', otpData.id)

    if (updateOtpError) {
      console.log('Failed to mark OTP as used:', updateOtpError)
      return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
    }

    // Update 2FA session
    const { error: sessionUpdateError } = await supabase
      .from('two_fa_sessions')
      .update({ is_2fa_completed: true })
      .eq('user_id', user.id)
      .eq('is_2fa_completed', false)

    if (sessionUpdateError) {
      console.log('Failed to update 2FA session:', sessionUpdateError)
      return NextResponse.json({ error: 'Failed to complete 2FA' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}