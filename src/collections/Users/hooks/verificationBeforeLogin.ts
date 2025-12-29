import { VerifyEmailHtml } from '@/components/emails/VerifyEmail'
import { CollectionBeforeLoginHook } from 'payload'

export const verificationBeforeLogin: CollectionBeforeLoginHook = async ({ req, user }) => {
  if (!user._verified) {
    const html = await VerifyEmailHtml({
      token: user._verificationToken,
      userEmail: user.email,
    })

    req.payload.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address - Fwatches',
      html,
    })

    throw new Error('Please verify your email before logging in.')
  }
}
