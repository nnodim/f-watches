'use client'

import { useAuth } from '@/providers/Auth'
import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { useLayoutEffect } from 'react'

export const AuthEcommerceSync = () => {
  const { status } = useAuth()
  const { onLogin } = useEcommerce()

  useLayoutEffect(() => {
    if (status === 'loggedIn') {
      void onLogin()
    }
  }, [onLogin, status])

  return null
}
