import { CollectionBeforeChangeHook } from 'payload'
import crypto from 'crypto'

export const addVerificationToken: CollectionBeforeChangeHook = async ({
  data,
  operation,
  context,
  req,
}) => {
  if (operation === 'create') {
    // Check if this is the first user
    const users = await req.payload.find({ collection: 'users', depth: 0, limit: 0 })

    if (users.totalDocs === 0) {
      // First user - automatically verify them
      data._verified = true
      // No need to create a token or send verification email
    } else {
      // Not the first user - require verification
      data._verificationToken = crypto.randomBytes(20).toString('hex')
      data._verified = false
      context._verificationToken = data._verificationToken
    }
  }
  return data
}
