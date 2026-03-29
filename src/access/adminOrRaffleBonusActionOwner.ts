import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

export const adminOrRaffleBonusActionOwner: Access = ({ req: { user } }) => {
  if (!user) return false

  if (checkRole(['admin'], user)) {
    return true
  }

  return {
    customer: {
      equals: user.id,
    },
  }
}
