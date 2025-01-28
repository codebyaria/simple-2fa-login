import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY!;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN!;
const mailgun = require('mailgun-js')({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN });

export class AuthService {
    private static supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    });

    private static generateOTP(): string {
        return randomBytes(3).readUIntBE(0, 3).toString().padStart(6, '0').slice(-6);
    }

    private static async sendOTPEmail(email: string, otp: string): Promise<boolean> {
        const data = {
            from: `Your App <noreply@${MAILGUN_DOMAIN}>`,
            to: email,
            subject: 'Your Login OTP',
            text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`
        };

        try {
            await mailgun.messages().send(data);
            return true;
        } catch (error) {
            console.error('Failed to send OTP email:', error);
            return false;
        }
    }

    static async initiateLogin({ email, password }: LoginCredentials) {
        try {
            const { data: { user }, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            if (!user) throw new Error('User not found');

            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const { data, error: otpError } = await this.supabase.rpc('create_new_otp', {
                p_user_id: user.id,
                p_otp_code: otp,
                p_expires_at: expiresAt.toISOString()
            });

            if (otpError) throw otpError;

            const emailSent = await this.sendOTPEmail(email, otp);
            if (!emailSent) throw new Error('Failed to send OTP email');

            return { success: true, message: 'OTP sent to email' };
        } catch (error) {
            console.error('Login initiation failed:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }

    static async verifyOTP({ email, otpCode }: OTPVerification) {
        try {
            const { data: { user }, error: userError } = await this.supabase.auth.admin.getUserByEmail(email);
            if (userError) throw userError;
            if (!user) throw new Error('User not found');

            const { data: codes, error: otpError } = await this.supabase
                .from('two_fa_codes')
                .select('*')
                .eq('user_id', user.id)
                .eq('otp_code', otpCode)
                .eq('is_used', false)
                .gte('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1);

            if (otpError) throw otpError;
            if (!codes || codes.length === 0) throw new Error('Invalid or expired OTP');

            await this.supabase
                .from('two_fa_codes')
                .update({ is_used: true })
                .eq('id', codes[0].id);

            const { data: session, error: sessionError } = await this.supabase.auth.setSession({
                access_token: user.id,
                refresh_token: user.id
            });

            if (sessionError) throw sessionError;

            return { success: true, session };
        } catch (error) {
            console.error('OTP verification failed:', error);
            return { success: false, error: 'OTP verification failed' };
        }
    }
}
