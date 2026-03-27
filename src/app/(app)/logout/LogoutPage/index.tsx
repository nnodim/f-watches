'use client'

import { useAuth } from '@/providers/Auth'
import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import React, { Fragment, useEffect, useRef, useState } from 'react'

export const LogoutPage: React.FC = (props) => {
  const { logout } = useAuth()
  const { onLogout } = useEcommerce()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const hasLoggedOut = useRef(false)

  useEffect(() => {
    if (hasLoggedOut.current) return

    hasLoggedOut.current = true

    const performLogout = async () => {
      try {
        onLogout()
        await logout()
        setSuccess('Logged out successfully.')
      } catch (_) {
        setError('You are already logged out.')
      }
    }

    void performLogout()
  }, [logout, onLogout])

  return (
    <Fragment>
      {(error || success) && (
        <div className="prose dark:prose-invert">
          <h1>{error || success}</h1>
          <p>
            What would you like to do next?
            <Fragment>
              {' '}
              <Link href="/shop/all">Click here</Link>
              {` to shop.`}
            </Fragment>
            {` To log back in, `}
            <Link href="/login">click here</Link>.
          </p>
        </div>
      )}
    </Fragment>
  )
}
