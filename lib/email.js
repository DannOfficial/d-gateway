import nodemailer from 'nodemailer'

export async function sendGmailVerificationEmail({ to, name, verificationUrl }) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.GMAIL_USER || process.env.SMTP_USER
  const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
  const from = process.env.GMAIL_FROM || process.env.SMTP_FROM || (user ? `Dann-Tele Gateway <${user}>` : 'Dann-Tele Gateway <noreply@dann-tele.com>')

  if (!user || !pass) {
    console.warn('[Gmail SMTP] GMAIL_USER or GMAIL_PASS environment variables not configured. Verification link logged below:')
    console.log(`[VERIFICATION LINK for ${to}]: ${verificationUrl}`)
    return { success: true, simulated: true }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
      <h2 style="color: #07131b; margin-top: 0; font-size: 22px;">Welcome to Dann-Tele Gateway</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Hi <b>${name || 'there'}</b>,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Please verify your email address to activate your account and start managing your Telegram bots.</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${verificationUrl}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #718096;">Or copy & paste this link into your browser:<br/><a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #edf2f7; margin: 24px 0;" />
      <p style="font-size: 12px; color: #a0aec0;">If you didn't create an account on Dann-Tele Gateway, you can ignore this email.</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Verify your email address — Dann-Tele Gateway',
      html,
    })
    return { success: true }
  } catch (err) {
    console.error('[Gmail SMTP] Email sending failed:', err)
    return { success: false, error: err.message }
  }
}
