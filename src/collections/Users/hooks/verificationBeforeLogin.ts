import { VerifyEmailHtml } from '@/components/emails/VerifyEmail'
import { APIError, CollectionBeforeLoginHook } from 'payload'

export const verificationBeforeLogin: CollectionBeforeLoginHook = async ({ req, user }) => {
  if (!user._verified) {
    const html = await VerifyEmailHtml({
      token: user._verificationToken,
      userEmail: user.email,
    })

    await req.payload.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address - Fwatches',
      html,
    })

    throw new APIError('Please verify your email before logging in.', 403)
  }
}
