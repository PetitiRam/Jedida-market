import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPasswordResetEmail(toEmail, resetLink) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`[JEDIDA][SANDBOX EMAIL] Password reset link for ${toEmail}: ${resetLink}`);
    return { sent: true, sandbox: true };
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@jedidamarketplace.com',
      to: toEmail,
      subject: 'Reset your JEDIDA Marketplace password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1B4332;">Reset your password</h2>
          <p>We received a request to reset your JEDIDA Marketplace password. This link expires in 15 minutes.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="background: #1B4332; color: #FBF6EC; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="color: #5B6760; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
      text: `Reset your JEDIDA Marketplace password: ${resetLink} (expires in 15 minutes)`
    });
    return { sent: true, sandbox: false };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { sent: false, sandbox: false };
  }
}
