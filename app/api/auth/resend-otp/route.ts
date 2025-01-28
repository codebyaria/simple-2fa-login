import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { generateOTP, getExpiryTime } from '@/utils/otp'
import { sendOTPEmail } from '@/utils/mailgun';

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const otp = generateOTP()
    const expiresAt = getExpiryTime()

    const { data, error: otpError } = await supabase.rpc('create_new_otp', {
      p_user_id: user.id,
      p_otp_code: otp,
      p_expires_at: expiresAt,
    })

    console.log(data);

    if (!data.success || otpError) {
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    const { success: emailSent } = await sendOTPEmail(user.email!, otp)
    
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}