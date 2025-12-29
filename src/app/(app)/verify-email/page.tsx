'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const hasVerified = useRef(false)

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No token provided.')
      return
    }

    if (hasVerified.current) return
    hasVerified.current = true

    const verifyToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/verify/${token}`, {
          method: 'GET',
        })

        if (res.ok) {
          setStatus('success')
          setMessage('Email verified! Redirecting to login...')
          setTimeout(() => {
            router.push('/login?verified=true')
          }, 2000)
        } else {
          const data = await res.json()
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
        }
      } catch (err) {
        console.error(err)
        setStatus('error')
        setMessage('An unexpected error occurred.')
      }
    }

    verifyToken()
  }, [token, router])

  return (
    <div className="w-full max-w-md p-8 space-y-4 bg-white rounded shadow text-center">
      {status === 'loading' && (
        <>
          <h2 className="text-2xl font-bold text-gray-700">Verifying...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h2 className="text-2xl font-bold text-green-600">Success!</h2>
          <p className="text-gray-600">{message}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">{message}</p>
          <div className="pt-4">
            <Link href="/login" className="text-blue-600 hover:underline">
              Return to Login
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 bg-white rounded shadow text-center">
            <p className="text-gray-500">Loading verification page...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
