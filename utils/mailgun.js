import formData from 'form-data';
import mailgun from "mailgun-js"

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
})

export const sendOTPEmail = async (email, otp) => {
  try {
    await mg.messages().send({
      from: `2FA <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: email,
      subject: 'Your 2FA Code',
      text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error };
  }
};