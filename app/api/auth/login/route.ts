import { NextResponse } from 'next/server';
import { generateOTP, getExpiryTime } from '@/utils/otp';
import { createClient } from '../../../../utils/supabase/server'
import { sendOTPEmail } from '@/utils/mailgun';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = await createClient()

    // First authenticate with email/password
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    // Check if 2FA is enabled for user
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_two_fa_enabled')
      .eq('id', user?.id)
      .single()

    if (!profile?.is_two_fa_enabled) {
      return NextResponse.json({ success: true, requires2FA: false })
    }

    // Generate and store OTP
    const otp = generateOTP()
    const expiresAt = getExpiryTime()

    const { error: otpError } = await supabase.rpc('create_new_otp', {
      p_user_id: user?.id,
      p_otp_code: otp,
      p_expires_at: expiresAt,
    })

    if (otpError) {
      console.error(otpError);
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    // Create 2FA session
    const { error: sessionError } = await supabase
      .from('two_fa_sessions')
      .insert({
        user_id: user?.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        expires_at: expiresAt,
      })

    if (sessionError) {
      return NextResponse.json({ error: 'Failed to create 2FA session' }, { status: 500 })
    }

    // Send OTP email
    const { success: emailSent } = await sendOTPEmail(email, otp)
    
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, requires2FA: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}