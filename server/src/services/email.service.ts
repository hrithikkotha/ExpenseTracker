import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendPasswordResetOTPEmail(email: string, otp: string): Promise<void> {
  const fromEmail = 'Expense Tracker <onboarding@resend.dev>';
  const subject = 'Password Reset OTP';
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-top: 0;">Reset Your Password</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">You requested a password reset. Please use the following one-time password (OTP) to complete the process. This OTP is valid for 10 minutes.</p>
      <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ RESEND_API_KEY is not configured. Logged OTP to console:');
    // eslint-disable-next-line no-console
    console.log(`🔑 OTP for ${email}: ${otp}`);
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send email via Resend:', error);
    throw new Error('Could not send password reset email.');
  }
}
