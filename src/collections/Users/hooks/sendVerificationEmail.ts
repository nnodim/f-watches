import { VerifyEmailHtml } from '@/components/emails/VerifyEmail'
import { CollectionAfterChangeHook } from 'payload'

export const sendVerificationEmail: CollectionAfterChangeHook = async ({
  doc,
  context,
  operation,
  req,
}) => {
  if (operation === 'create' && context._verificationToken) {
    const html = await VerifyEmailHtml({
      token: context._verificationToken as string,
      userEmail: doc.email,
    })

    await req.payload.sendEmail({
      to: doc.email,
      subject: 'Verify Your Email Address',
      html: html,
    })
  }
}
