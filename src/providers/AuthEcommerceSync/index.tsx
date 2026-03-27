'use client'

import { useAuth } from '@/providers/Auth'
import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { useLayoutEffect } from 'react'

export const AuthEcommerceSync = () => {
  const { status } = useAuth()
  const { onLogin, onLogout } = useEcommerce()

  useLayoutEffect(() => {
    if (status === 'loggedIn') {
      void onLogin()
    }
  }, [onLogin, onLogout, status])

  return null
}
