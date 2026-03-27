'use client'

import { useAuth } from '@/providers/Auth'
import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect } from 'react'

export const AuthEcommerceSync = () => {
  const { status } = useAuth()
  const { onLogin, onLogout } = useEcommerce()

  useEffect(() => {
    if (status === 'loggedIn') {
      void onLogin()
    }

    if (status === 'loggedOut') {
      onLogout()
      window.location.reload()
    }
  }, [onLogin, onLogout, status])

  return null
}
